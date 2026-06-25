---
title: "Nix Evaluation Is a Scheduling Problem"
description: "Why I built evix, and why the interesting part was never about talking to Nix"
date: "2026-06-25"
keywords: ["nix", "rust", "programming"]
---

Most, if not all, Nix tools I build (or at least, consider building) eventually
want to do one little boring thing. They want _a list of derivations an
expression produces_. Not necessarily a build log---I've got [a crate for that]
already and those are relatively trivial to parse already and nor a closure but
a **a list of jobs**. Those usually require their attribute paths, names,
systems, `.drv` paths and outputs to be visible and _if_ you're building
something like Hydra then you need those before you can decide what to build.
I.e., those are the things a CI system needs before it can decide what changed.
While I haven't quite tried, those are also things I imagine a deployment tool
needs before it can decide whether the graph in front of it is the same
abomination it saw five minutes.

This isn't exactly a problem statement, but it's more or less the problem I've
had. Because it _sounds_ like a one-time cost, however, you eventually realize
that it isn't. You also realize that it's about the inner loop. _If_ you don't
realize what it's about, then you make the same mistake I did and think to
yourself about how TRULY intelligent you are and how you could totally,
DEFINITELY get away with re-using the same hacks over and over again.

I think the first time I've used this model was in my NixOS configuration's CI
where I combined `nix-eval-jobs` with `jq` and then passed the graph to Nix to
build my things. Important distinction here is that a CI system asks on every
push. A fleet of `nixosConfigurations` asks once per host, then again when you
only care about one system, then again when you want a proper diff. A watcher
asks after each file write. A daemon asks because a separate command invocation
forgot what the previous one already learned. And evaluating a real flake is not
free either. It is thousands of attributes, lazy thunks waking up (just enough
to hurt you), and a wall-clock cost you notice mostly because you pay it again
for the next question. Now let me state the obvious: Nix's eval cache
_**sucks**_. And I can tell you that I am not interested in a cache-shaped
_thing_ that's masquerading as one.

For a very long time I've thought that my complaint was that evaluation was slow
(it is) and that the output was annoying to parse (it is). It's roughly the same
kind of experience as having an entire piano fall on top of your head while
taking a stroll but that's not what ruins my day. What annoys me the most is
_not_ having a gravitationally-challenged piano deciding to ruin my evening
stroll but the cost that is the program doing the evaluation had already built
the interesting structure, printed a representation of it, and then died.
Naturally the graph dies with it. Go figure.

When I started calling `jq` (which I'm not a huge fan of) I slowly started to
grow suspicious that the tool I'm using is... wrong. As I've mentioned, I
initially started by slapping `nix-eval-jobs` on top of my problems and I _do
not_ want to lead you to think it is bad software, [^1] but it's pretty much
_not_ what I was looking for. There were still a lot of annoying gaps that would
take too long to fill via traditional means and I _know_ it'd suck to do so
because C++ sucks. Anyway my point is that it's a relatively good tool for
finder for what a Nix job evaluator should find and [evix] still leans on it in
benchmarks because I acknowledge it, and I strive to be _better_ than it.

[^1]: I'm pointing out so that you don't mistakenly think that I'm inherently
    negative to every project I aim to replace. I do have my reservations about
    nix-eval-jobs and some of its development but it would be very easy and very
    easy to dishonestly tell you evix is good because nix-eval-jobs is bad. The
    main difference between the two projects ultimately boils down to the fact
    that my eyes are on a different boundary. I wish to evaluate, keep the
    graph, answer typed questions and let work happen on machines that are not
    necessarily this one. Hope it is clear that this is not me discouraging you
    to drop nix-eval-jobs because it is bad; this is me telling you why evix
    exists and how it operates under different assumptions. Namely, regarding
    your needs.

[evix]: https://github.com/manic-systems/evix
[Circus]: https://github.com/manic-systems/circus
[nix-bindings]: https://github.com/notashelf/nix-bindings

## Enter, Evix

Evix is what I wrote to solve my general woes around structured and persistent
evaluations. It is a library-first async Nix evaluation engine that evaluates
flakes, files or inline expressions through the stable Nix C API, via my very
own [nix-bindings], and reports derivations as typed events. There exists a CLI
too, in case you want to replace nix-eval-jobs in your CI setups, but despite
being very useful it is _not_ the center of my design. The center is the
embeddable _library API_ and `Session`: a long-lived evaluation object that can
stream the first run, retain the graph, answer queries, compute diffs, and watch
local inputs for changes. The daemon is complementary, and it is ultimately just
that idea moved behind a Unix socket so separate command invocations can share a
warm session instead of re-enacting the fall of man every time you type a new
command.

As much as I want to replace Nix, Evix is not a Nix replacement and I don't
replace Nix _yet_. Evix is, most simply put, the architecture around evaluation:
process isolation, scheduling, backpressure, event accumulation, daemon state,
remote workers, and enough respect for the C API that I do not have to scrape a
terminal and call it data or torture yourself with the C++ API. If there is a
technical marvel here, it is not that I discovered fire. No, I was not there to
discover fire. But the parts of Evix are quite interesting. Most of them mundane
and sharp-edged, line up into a proper model where Nix evaluation becomes
something more reliable and something you can pretty much _hold on to_---for the
lack of a better term.

## One Value, One Event

If you're not bored with me yet, I'd like to describe the model to you. Maybe
you'll find it interesting, or maybe you've got better ideas than me and you'll
help develop mine. In either case, I would like to spend the rest of this post
talking about how Evix operates.

The model starts smaller than people expect. A worker does not walk a whole
flake. It evaluates one attribute path and returns one event. Hand it
`packages.x86_64-linux.hello` and it navigates from the root value to that path
through the Nix C API, auto-calling functions on the way when the configured
arguments make that possible. Then it asks what it found. If the value is a
derivation, evix reads the derivation name, target system, `.drv` path and
outputs. If requested, it also reads `meta`, input derivations from the `.drv`,
Hydra-style `constituents`, and registers GC roots. If the value is an attribute
set, evix does not recursively disappear into it. It returns the child names as
an event. If forcing the value throws, that is an error event. Nonfatal errors
are part of the stream, not a reason to throw away the whole run.

That last sentence is more important than it looks. A large Nix graph is not a
Victorian (or 19th century Ottoman) novel where every character has to survive
until the last chapter. One bad package should not erase the packages next to
it. Errors need names and paths and enough structure that a caller (and
consequently, you) can decide what to do with them. A byte stream can tell you
something went wrong. A typed event can tell you where it went wrong and still
let the rest of the graph arrive. Everybody wins!

It helps to see the thing evix is walking. A flake output is usually a tree of
attribute sets with derivations at the leaves, trimmed down to something like
this:

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

Behold my artistic skills! The recursion does not live inside a call stack that
one worker owns. It lives in a queue. The coordinator seeds the queue with the
root path. A worker pulls a path, evaluates it, and returns an event. An attrset
event adds more paths to the queue. A derivation event is terminal. An error
event is terminal for that path. The run ends when the queue is empty and no
worker is busy.

Walked as a queue rather than a private recursion, that tree drains roughly like
this, in whatever order the workers happen to answer:

```text
queue: [ .# ]
  .#                            attrset    -> enqueue packages, devShells
  packages                      attrset    -> enqueue packages.x86_64-linux, ...
  packages.x86_64-linux         attrset    -> enqueue ...hello, ...git, ...ripgrep
  packages.x86_64-linux.hello   derivation -> emit; enqueue nothing
  packages.x86_64-linux.git     derivation -> emit; enqueue nothing
  …
empty queue, nothing in flight  → done
```

> [!NOTE]
> evix does not recurse into every attrset by default. It follows the same basic
> idea tools like this usually follow: recurse at the root, and recurse into
> attrsets that opt in with `recurseForDerivations`. There is a
> `--force-recurse` option for the times you really do want to kick down every
> door, but the default is _less_ stupid. Nixpkgs has many rooms. Some contain
> jobs. Some contain machinery. Some contain things that make you regret
> curiosity as a concept.

The important invariant, which I call important because it caused many
breakages, is that the answer is a graph keyed by attribute path, not by the
order events happened to arrive. One worker and four workers should produce the
same graph. Naturally, local workers and remote workers should feed the same
accumulator. The event stream is temporal because programs live in time, but the
resulting graph is not supposed to depend on scheduler luck. That is the licence
to use parallelism. [^2]

[^2]: [We used to have good things](https://www.imdb.com/title/tt0097742/).

It's also worth talking about Evix's benchmark suite. I'm _yet_ to to benchmark
Evix in more advanced production scenarios, but on the current _toy_[^3]
benchmark fixture, which is designed to measure scheduling and evaluation
overhead rather than build time, evix with one local worker sits around 318ms,
four local workers around 198ms, and eight local workers around 216ms.
`nix-eval-jobs` with four workers is around 359ms on the same fixture.
Remote-only evaluation over loopback with four workers lands around 269ms. [^4]
Do not read those numbers as a universal law. The fixture is rather cheap, so
overheads are loud and real flakes will move the constants around. Read them as
evidence that the session, graph and distribution model are not bought with a
throughput tax large enough to make the project silly.

[^3]: Anyone who's experienced in Nix will be able to tell you that it's a _bad_
    benchmark suite. Admittedly I haven't thought too much about benchmarking
    and I _probably_ should test with real-life scenarios sooner than later.

[^4]: The benchmark fixture is a stinky pile of trivial derivations whose `.drv`
    paths are computed but never built. There is no IO-heavy build hiding
    scheduler overhead. The daemon numbers are also worth reading carefully: a
    warm query inside the library is a map scan, but the CLI still pays for
    daemon IPC, serialization, and writing output. Full-output queries are not
    magic. Narrow queries are where the warm graph starts to feel like cheating,
    because it is no longer doing evaluation work to answer them.

## Processes, Not Threads

If you have ever watched a Nix evaluation climb past the memory you have and get
killed three-quarters of the way through, taking the whole run with it, this is
the part that concerns you. [^5] Evix workers are subprocesses, not threads. The
host process owns the queue and the warm graph. Each worker owns its Nix
context, store handle, eval state and root value. The boundary is crude in the
way Unix is crude, which is to say it is one of the few crude things in
computing that still works.

[^5]: It concerns me _so much_ in fact, that I have Nix cgrouped to limit how
    much CPU, RAM and IO it can use thanks to Systemd's cgroup accounting.
    Without it, Nix evaluation _regularly_ kills low-end machines that I happen
    to have the misfortune of rebuilding on.

After each attribute, the worker checks its maximum resident set size against a
configured limit, 4 gbs by default. If the worker is over the line, it returns a
`Restart` status and exits. The coordinator goes ahead and spawns a fresh worker
and continues feeding the same queue. The graph is in the parent, so the graph
survives. The worker's heap is in the worker, so the leak does not become a
blood oath the host process has to honor forever. This is _especially_ important
if you're interested in embedding. By default, local workers re-exec the
embedding binary and enter the worker protocol when `EVIX_WORKER` is set. If
your host program cannot or should not re-exec itself, you can point
`ConfigBuilder::worker_exe` at a dedicated worker executable instead. The worker
protocol is still the same: setup message, work path, event, status. The magic
is mostly refusing to make the embedding process also be the place where libnix
gets to leak memory for sport.

One footnote worth keeping around is that the memory check happens between
attributes. It catches the common case where a worker grows over many paths,
BUT, it does not save you from one attribute that detonates mid-force before
control returns to the check. Evix can time out an item, abort a worker and
reconnect. It can report stderr. It can keep the host alive. It cannot make
libnix interruption into a property it does not have. I'm a poor man. All I've
got is a process boundary and an RSS check. Different budgets, I guess.

## The Session Is The Product

The first version of the idea that evolved to the Evix of today could be
explained roughly as "evaluate once, keep the graph." That is, well, still true,
but the current model is more precise: an evaluation configuration opens a
`Session`; the session streams the initial event log once; draining that stream
populates warm state; queries and diffs operate on that warm state until you
replace it. This sounds like API trivia, which I'd love to provide, but it is
genuinely important because it basically changes the shape of the programs you
can write. A CLI pipeline gives you a list. A session gives you memory and
identity. The graph is a `HashMap` keyed by attribute path, with derivation
records as values. A query is a filter over that graph: systems, attribute
prefixes, exact attrs, names, `.drv` paths, include patterns, exclude patterns.
A diff is a fresh evaluation compared with the previous graph; if the same
attribute path points to a different `.drv` path, Evix treats it as a remove and
an add. Something something the ship of Theseus something.

The library API exposes that more directly. `Session::stream` is single-use
_because the initial evaluation is single-use_. `Session::query_snapshot` reads
the warm graph. `Session::diff_once` re-evaluates and swaps in the new graph.
`Session::watch` does the same lil' dance after fs notifications for local files
and local flake inputs. The bounded variants exist because embedders sometimes
need backpressure, as one does, and unbounded channels are a nice way to turn
"my stdout is slow" into "honey, why is my process enormous?" Ask me how I know.
Actually, please don't.

### The Daemonhost [^7]

[^7]: Like in Warhammer? Hmm? Hmm?

The daemon is a thin extension of the same idea as Evix. It listens on a Unix
socket, keeps a small registry of warm sessions, and keys them by the evaluation
config: input, arguments, Nix options, worker count, memory limit, remote
endpoints, metadata flags, the whole boring lot.

Actually the idea for the daemon comes from our goals in [Circus] to distribute
_not only builds_, _but evaluation as well_. A cache that ignores the
configuration is not a cache, it is a liar with good latency. If you evaluated
with one set of overrides and query with another, you should get a miss, not a
beautifully fast wrong answer. Similarly, a cache is not a proper cache if it's
not a cache according to a different machine.

Alongside the daemon, there exist a few other `evix` commands to wrap Evix's
excellent (if I may say so myself) library interface:

- `evix eval` evaluates once and streams NDJSON. If the daemon is available, it
  can also leave a warm session behind.
- `evix query` asks an already warm daemon session for a filtered snapshot.
- `evix diff` re-evaluates and compares against the warm graph.
- `evix watch` evaluates a local file or flake and emits diffs as watched inputs
  change.
- `evix worker` starts a remote worker service.
- `evix daemon` starts the Unix-socket daemon explicitly, if you do not want the
  CLI to pretend all of this happens by divine intervention.

[Manic Systems]: https://github.com/manic-systems

So my point is that Evix is _not merely a faster way to print the same list_. It
is a way to keep the evaluated graph resident long enough that follow-up
questions become ordinary program operations. It also isn't a Nix eval wrapper.
Evix was specifically designed for [Circus], the (hopefully futureproof) CI I am
working on at [Manic Systems], where the difference between "wait for
evaluation" and "ask the already evaluated world what changed" is critical for
our use case. The latter is a much nicer sentence to live inside---it's also a
nicer way of doing what Hydra does, and more reliable too.

## Workers That Aren't Here (They Are On Strike)

A worker is an odd little thing that I decided mirror from Circus' distributed
_agents_ design where a worker _receives an attribute path and returns an
event_. Once you phrase it that way, there is no deep reason it has to be on the
same machine as the coordinator---similar to Circus' agents. This is where evix
stops being a local optimization and starts looking like a scheduler in the
old-fashioned sense. It has a queue, and opinions about who should do what.
Remote workers are TCP services speaking Cap'n Proto messages. Remember when I
said distributed evaluation? Yeah that's exactly it.

A connection opens with a setup handshake containing the evaluation config,
protocol version, token, and expected store directory. Then it repeats the small
loop: `Work(path)` goes out, `Event` and `Status` come back. `TCP_NODELAY` is
set because the protocol is one tiny request-response per attribute, and Nagle's
algorithm is what happens when the network stack decides your latency profile
should be a moral lesson. [^6]

[^6]: While implementing remote workers for Evix I spent an afternoon or two
    absolutely _convinced_ that I had written a deadlock because the remote
    benchmark was catastrophically slower than the local one. I mean the numbers
    were off the charts. The program was fine. The socket was patiently batching
    tiny messages in exactly the way TCP was allowed to do. One little code
    review from a friend, one `setsockopt`, a little less dignity, and the
    numbers looked sane again. Oh joy.

Each remote connection gets its own evaluator subprocess on the far end, so
`--remote builder-a:7357 x86_64-linux 4` means four worker connections to that
endpoint. With `--workers 0` and at least one remote, the coordinator can run no
local workers at all. At that point your local process is almost pure scheduler:
it owns the queue and graph, while the machines that can actually evaluate the
interesting systems do the forcing. On this note, however, system routing has a
subtle limitation worth saying plainly. **A derivation's `system` is not known
until the attribute has been evaluated**. Evix therefore cannot always know,
before evaluation, which machine is the perfect one for a path. Remotes declare
the systems they own, and the coordinator checks returned derivations against
the pool. If some local, catch-all, or owning remote accepts that system, the
event is valid. If no worker in the pool accepts it, evaluation fails by name
with a fatal error instead of quietly losing the derivation. That is less
magical than perfect pre-routing and much better than lying to ourselves or
making a best-effort guess.

There is also a store-directory handshake. A remote whose Nix store directory
does not match the coordinator's is rejected, because `.drv` and output paths
are only meaningful to the consumer if they point into the same kind of store.
This is, well, not remote building. Obviously. Evix is not copying build
products around. It is evaluating and reporting derivations. If you want remote
build output transfer, that belongs to Nix's builder model or to a CI system
above `evix`, not to the evaluator pretending it also wants to be a builder when
it grows up. Quite frankly this is the part of evix I like most, because it is
not grand. It does not say "distributed systems" and then demand a control
plane, a service mesh, and worse... YAML. It says the unit of work is already
serializable, the event is already serializable, and a worker was already
disposable. Put a socket between them. Make the protocol explicit. Refuse
remotes that cannot mean the same store paths. Move on.

<!-- TODO: what does Evix solve? -->

## Closing Thoughts

So, that is Evix as it stands today. It's certainly been through a lot of
iterations over I can probably only describe as _ages_ before I decided to sit
down and port my low-effort Python to proper Rust. It is not a one-shot
evaluator (anymore) with a nicer coat of paint, but a session-oriented
evaluation engine with a proper CLI attached. The combination changes the
question from "how do I print the jobs again?" to "what do I want to ask the
graph I already have?" If you're _building with_ Evix it gives you a very nice
toolkit to answer your questions in mere seconds. That's about it for what my
"trick" is. I want to go ahead, get a _bit_ philosophical, and say that a tool
is partly defined by what it lets you remember. The old shape made evaluation an
_event_. Evix, however, tries to make it an _object_: scheduled, isolated,
queryable, diffable, and capable of crossing machine boundaries without
pretending those boundaries are not there.

If a one-shot list piped into `jq` is all you need, or rather, insist is all you
need then you do not need any of this. But by all means, use the simpler thing
and enjoy the rare luxury of not needing my problems. I needed evaluation to
stay alive inside a program, with typed values instead of a byte stream, and
with enough scheduling machinery that the work could survive large graphs, leaky
workers and machines that are not the one under my hands. That is a narrow need,
and it is mine.

Evix is [on GitHub][evix] if that sounds like your problem too. Cheers.
