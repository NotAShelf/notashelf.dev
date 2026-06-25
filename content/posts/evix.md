---
title: "Nix Evaluation Is a Scheduling Problem"
description: "Why I built evix, and why the interesting part was never about talking to Nix"
date: "2026-06-25"
keywords: ["nix", "rust", "programming"]
---

Every Nix tool I build eventually, ultimately wants the same boring thing: a
list of what a flake produces, across some set of systems, before anything gets
built. It sounds like a one-time cost, but actually, it is the opposite of one.
It is the inner loop. Why? Because I keep having to do it, and I keep forgetting
how I did it the last time around.

A CI system asks it on every push. A fleet of `nixosConfigurations` asks it once
per host. Anyone watching a flake asks it again every single time they want to
know what changed. And evaluating a real flake is not free either---it is
thousands of attributes and a wall-clock cost you notice, paid back in full
every time you have a new question. Let me put this out here: Nix's eval cache
sucks.

The tools that hand you that list are one-shot programs you run and scrape.[^1]
For a long time I assumed I disliked that because evaluation is slow and the
output is fiddly to parse. That was wrong, or well, it was only partially true.
I disliked it _because_ the cost I was paying was not the evaluation, it was
paying for it _again_ on the next question, from outside a process that had
already done the work and then thrown it away. It prints, and then it is gone,
and the graph goes with it. Which is to say that the price was my sanity and I'm
already really low on that.

[^1]: The usual one is `nix-eval-jobs`, and to be fair to it: the evaluation it
    does is sound, and evix's own test suite leans on it as the reference oracle
    to check evix against. I don't reach for it because it is a CLI and not a
    library. There is no in-process graph to hold, so every follow-up question.
    Now only the `aarch64` jobs, now what changed since last time---is another
    full evaluation from scratch. Its workers are also local-only, with no way
    to let one machine own the systems it can actually evaluate for. Those three
    things; a library, a graph that persists, work that crosses machines---are
    exactly what I needed, and none of them are things you bolt onto something
    built to print once and exit.

[evix]: https://github.com/manic-systems/evix
[Circus]: https://github.com/manic-systems/circus

[evix] is what I wrote instead. The thing that makes "evaluate once, keep
asking" and "spread the work across machines" both cheap is not a cleverer
evaluator. It is refusing to treat evaluation as a walk through a tree, and
treating it as a worklist of independent attributes instead. Evix is designed
_specifically_ to be a library-first project that can be embedded to things like
[Circus], the Nix CI I'm working on, but can also be put in your NixOS
configuration or your GitHub actions directly.

## One Attribute at a Time

This is the model these tools tend to converge on---evix did not invent it---
but it is worth seeing plainly, because everything else in the post falls out of
it.

A worker does not walk a flake. It evaluates one attribute path and stops. Hand
it `packages.x86_64-linux`: it navigates to that value through the C API,
forcing thunks and auto-calling functions on the way down, and answers one
question. Is this a derivation, or an attribute set I should descend into? A
derivation, and it reads off the name, the system, the outputs, the `.drv` path,
and emits one event. A set, and it does _not_ descend; it writes down the names
of the children and emits an event saying so. Then it is finished with that
path.

It helps to see the thing it is walking. A flake's outputs are a tree of
attribute sets with derivations at the leaves---trimmed, something like this:

```text
.#                       root; always recursed into
├─ packages
│  ├─ x86_64-linux       attrset    (expand: one work item per child)
│  │  ├─ hello           derivation (leaf)  hello-2.12.1
│  │  ├─ git             derivation (leaf)  git-2.45.2
│  │  └─ ripgrep         derivation (leaf)  ripgrep-14.1.0
│  └─ aarch64-linux      attrset
│     ├─ hello           derivation (leaf)
│     └─ git             derivation (leaf)
└─ devShells
   └─ x86_64-linux
      └─ default         derivation (leaf)
```

The recursion lives nowhere in particular. A queue holds attribute paths, a
coordinator drains it, and a "here are the children" event turns into new
entries on the queue. A derivation is terminal; an error is terminal. The run
ends when the queue is empty and no worker is busy. The tree is never assembled
anywhere in the program---it is a worklist that keeps refilling itself until it
doesn't.

Walked as a queue instead of a recursion, that tree drains roughly like this, in
whatever order the workers happen to hand results back:

```text
queue: [ .# ]
  .#                            attrset    → enqueue packages, devShells
  packages                      attrset    → enqueue packages.x86_64-linux, …
  packages.x86_64-linux         attrset    → enqueue …hello, …git, …ripgrep
  packages.x86_64-linux.hello   derivation → emit; enqueue nothing
  packages.x86_64-linux.git     derivation → emit; enqueue nothing
  …
empty queue, nothing in flight  → done
```

Structurally that is a tree traversal with extra steps. What it gives
up---any single worker owning the recursion---is exactly what makes the rest
cheap. The only state that matters is which paths are still outstanding, so the
work is splittable by construction, and evix's tests pin down that splitting it
never changes the answer: one worker and eight workers emit the byte-for-byte
same set of derivations. That invariant is the licence to actually use the
parallelism. On the bench fixture---around 1,300 trivial derivations, so it is
scheduling being measured and almost nothing else[^2]---going from one worker to
four takes a run from 1.38 seconds to 0.62, a touch over 2x, for the identical
result. It flattens by eight, because trivial derivations leave nothing to split
once four cores are busy; the shape of that curve is a property of the fixture,
not a ceiling, and with real per-attribute work or more machines it is yours to
push. For what it is worth, at four workers evix comes in around 0.62 seconds
against `nix-eval-jobs`' 0.80 on the same input---roughly a third quicker, which
mostly proves the borrowed model was borrowed faithfully and the graph and
distribution below are not paid for in throughput.

[^2]: The fixture is a tree of `breadth^(depth+1)` distinct, trivial derivations
    whose `.drv` is computed but never built, so the wall-clock is pure
    evaluation and scheduling. No IO, no building. Measured with `hyperfine` on
    loopback. Real flakes do heavier per-attribute work, which moves the
    constants and tends to _help_ parallelism rather than hurt it, so read these
    as a floor on the architecture, not a promise about your flake.

## Workers You Can Throw Away

If you have ever watched a long evaluation climb past the memory you have and
get killed three-quarters of the way through, taking the whole run with it, this
is the part that concerns you. Because the unit of work is one independent
attribute, a worker holds nothing between attributes that anyone else needs.
That makes it disposable, and disposable is the whole answer to that failure.

Each worker is its own process. After every attribute it checks its own resident
memory against a limit---four gigabytes by default---and if it is over, it exits
and the coordinator spawns a fresh one and keeps feeding it the queue. The run
does not notice. A hostile attrset can bloat a worker as much as it likes; that
worker gets thrown away and replaced, and nothing it was sharing an address
space with exists, because it was sharing one with nobody. The thing that used
to take down a multi-minute evaluation now costs you one respawn nobody sees.

The honesty footnote on that: the check runs _between_ attributes. It catches a
worker that grows steadily over thousands of paths, which is the common case. It
does not catch a single attribute that blows the limit in one allocation
mid-force, before control returns to the check---that one gets OOM-killed rather
than recycled, and the coordinator sees a worker that died waiting to answer
instead of one that bowed out cleanly. The host still survives and you get the
worker's stderr instead of a hang, but it is a process dying, and the real fix
(accounting during a force, not only after) is not written yet.

## Workers That Aren't Here

A worker is "a thing that takes a path and returns an event." Nothing about that
says it has to be on your machine, and that is where two ceilings lift at once:
the one your core count puts on throughput, and the one that has your `x86_64`
laptop cross-compiling---or worse, emulating (the horror!)---`aarch64` work it
has no business touching.

evix can run a worker as a TCP service; point a coordinator at it and each
connection spawns its own evaluator process on the far end, identical in
behaviour to a local one. To the coordinator, a worker across the network and a
worker across a pipe are the same kind of thing pulling from the same queue. Run
with no local workers and a few remote ones and the coordinator becomes pure
scheduler, handing `aarch64` paths to the `aarch64` box and keeping the rest
home.

Remote workers behave exactly like local ones, with one property a local-only
pool never needs: a remote may _refuse_ work it cannot do. A worker that owns
only `x86_64-linux`, handed an `aarch64` derivation, says so, and the
coordinator requeues that path for someone eligible instead of dropping it. Only
if every worker refuses does evaluation fail, and it fails by name rather than
quietly losing a derivation in a run you thought was complete. Over a real
socket the toy fixture runs about 1.5x slower than local---0.96 seconds against
0.62---which is just the round-trip showing up on derivations too cheap to hide
it, and it shrinks toward nothing as the per-attribute work grows.[^3]

[^3]: That 1.5x is only that small because the sockets set `TCP_NODELAY`, which
    I can tell you with confidence (and in confidence, I trust you) because I
    once spent an afternoon certain I had written a deadlock, when what I had
    actually written was a perfectly correct program that happened to run sixty
    times slower than the local one on loopback. The protocol is one tiny
    request-response per attribute---exactly the traffic Nagle's algorithm
    exists to batch, and therefore exactly the traffic it ruins. One
    `setsockopt` and a portion of my self-respect later, it was fine.

## The Graph Stays

All of which exists to serve the part that is dull to state and was the entire
point. The first evaluation costs what it costs; every question after it does
not. The graph is still in memory, so filtering it to one system, or
re-evaluating and diffing against it to see what a commit changed, is a lookup
over a map---microseconds, not another 0.62 seconds on the toy fixture and not
another minute on something real. A small daemon keeps these graphs warm across
separate command invocations, keyed on the evaluation config, so the same flake
asked for the same way hits the same warm graph, and asked for _differently_
gets a fresh one rather than a wrong answer computed under settings you didn't
mean.

For a tool that re-asks on every commit, that is the whole game: the difference
between something you wait on and something you query. The queue underneath it
only earned its keep because of this.

## Where It Stops

evix evaluates. It will tell you the `.drv` path and the outputs a derivation
_would_ produce; it does not build them. Building is stateful and
resource-hungry and careful in ways evaluation is not, and it fails for
unrelated reasons at unrelated times, so it belongs to [Circus] and not here. An
evaluator that also builds is two programs sharing a process, and I would rather
have two programs.

## Closing Thoughts

So that is evix. The worklist model is borrowed and the per-attribute workers
are nothing new; what evix does with them is refuse to throw the result away and
refuse to keep the work on one machine, and the numbers say it does that without
costing you any speed against the tool it replaces. If a one-shot list piped
into `jq` is all you need, you do not need any of this. I needed to evaluate
once and keep asking, from inside a program, holding typed values instead of a
byte stream. That is a narrow need, and it is mine.

It is young, the ceilings above are real, and what it wants most now is flakes
bigger than my fixtures pointed at it. It is [on GitHub][evix] if that is you.
Cheers.
