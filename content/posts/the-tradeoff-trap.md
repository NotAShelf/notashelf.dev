---
title: "The Tradeoff Trap"
description: "When Simplicity Feels Like Surrender"
date: 2025-08-11
keywords: ["thoughts", "software", "programming"]
---

Not so long ago, I have spent quite a bit of time writing a new component for my
site. It is not really _that_ fancy. Though suffice it to say, it took more time
than it was worth; the component is written in Rust, compiled to WASM using
`wasm-pack` and it's shoehorned into my Astro stack through a Vite plugin that I
_probably_ regret adding to my site. It does work, technically, but it's not
too clean. It's not even clever. It just... feels heavy. [^1]

[^1]: And the performance benefits aren't even that great! What happened to my
    blazingly fast, memory-safe Rust?

Truth be told, I did enjoy the experiment. I have been long fascinated by the
idea behind WASM, and this was a fair excuse to finally give it a shot myself.
This whole ordeal started because I wanted to fix something small: my search
widget. However, I ended up dragging the rest of the codebase into it like a
black hole pulling in nearby stars... as usual. Several components got written,
new abstractions had to be born, and a majority of the codebase changed to
accommodate this experiment. I opened a second terminal window just to keep
track of my regrets.

Somewhere in the middle of this mess, I remembered when my site was a single
text file. A _literal `.txt` file_ dumped into `/var/www/html` and served via
NGINX. No JavaScript, no build step. No decisions whatsoever. It just _was_.

So, how the hell did I end up here?

## The Itch That Builds Complexity

There is this itch that I have. It has me so that simplicity and stagnation
bother me a little. Hell, I can still remember the night I rewrote a single
utility three times. First version: 30 minutes, dead simple, rock solid. Second
version: three hours of reactive garbage and decorators that made the call stack
look like performance art. Third version: a weird hybrid that used a language
feature I had to re-learn every time I saw it. None of them felt right. I hated
all of them. And not in the funny self-deprecating way. I mean actual disgust.
Because none of them satisfied both sides of me: the builder and the tinkerer.

The itch comes when I write code that is too simple. You probably do too. It's
that little voice that says: you could be more clever than this. You could
abstract this. You could invent something novel. It’s not about what the code
needs. It’s about what you need: a little shot of novelty, a way to prove that
you still know how to do something slightly absurd. And sure, I tell myself it's
for maintainers. Future contributors. Elegance.

But the truth? I do it for myself. For the thrill of wrapping a problem in
something unnecessarily beautiful. To prove that I can.

## The Joy Tax

Truth be told, joy matters. It drives creativity. It is also why I still spend
time programming. However, it comes with a tax. Joy tells you that
layering three patterns on top of each other is fine because you will _totally_
clean it up later. Joy tells you that you are learning. Sometimes that's true.
But more often, it leaves behind a breadcrumb trail of entropy. Small
complications that add up over time until you're afraid to touch anything
without a full test suite and a stiff drink.

Simplicity, on the other hand, has a kind of power I have a hard time
describing. If I were to try and visualise it for you, I'd tell you of a puzzle
piece falling into place on the first try. Just in.

Consider this. A loop. A few conditionals. No clever tricks. No helper macros
that magically know what context you're in. Just boring code. And I mean that in
the best way. Boring code runs fast. It fits in your head. It does not surprise
you six months later.It might look uninspired but it has its own power.
Simplicity means you can revisit it months later and feel like you understand it
immediately. It means fewer bugs and fewer performance surprises. A plain
solution usually uses less memory and runs faster without requiring a profiler.

Yet there is this intriguing feeling that accompanies simplicity. It feels
almost like surrender. It feels like admitting the challenge was too difficult
Maybe we fear judgement for writing something that looks
pedestrian. We call it _boring_ code instead of reliable code. We convince
ourselves that plain means uninspired when in reality it often means practical
and predictable.

## A Fork in the Road

Projects used to come in two broad flavors. At least there are two that are
relevant to us today, but the new third variant is more sinister. Traditionally
there were those two flavors. Anyway, I digress.

You either get the reliable, boring version that just works and feels like a
spreadsheet with a keyboard. Or you build something expressive and brilliant
that collapses under its own weight the moment your attention shifts. Neither
path is inherently better. What matters is context. A tiny service that
processes thousands of requests per second deserves minimal overhead. Pull in
fewer dependencies and write code that can be understood with a single glance.
In that space, every millisecond counts and every external library is a
liability. You need the plain solution.

By contrast, a research prototype meant to explore an idea might not care about
raw performance. It _might_ benefit from dynamic typing or metaprogramming even
if that code will never see production. In that realm the joy of creativity and
the speed of iteration trump long term maintenance. The cost of rewriting from
scratch is acceptable because you will probably scrap it once you learn what
works. The cost of learning something new is far less than the cost of missing new
knowledge.

The real trap is believing you can have everything. High performance plus
effortless maintainability plus endless enjoyment. Right. There is a narrow
sweet spot in the design space but for most projects it is elusive. You end up
either cutting complexity until nothing interesting remains or stacking layers
until you cannot find the core logic anymore. The only skill worth mastering is
knowing which sacrifice to make at what moment.

## Chisel and the Sledgehammer

Sometimes you need a chisel. You want to carve something that fits perfectly,
piece by piece. Other times, you need a sledgehammer. Bash it together until it
stands and deal with the mess later. There is nothing noble about always
choosing one tool.

Sometimes the best path forward is plain. Your code will not sparkle, but it
might just hum along quietly without any unpleasant surprises. Alternatively,
the best path forward might just be _intricate_. Your code may creak under
pressure but it will teach you things you could never learn with a toy example.
Neither choice diminishes you as a coder. Both are valid expressions of craft.

So the next time you stand at that crossroads, pause before you reach for the
clever trick. Ask yourself what you truly need from this project. Do you need
speed or delight in playing with language features? Do you need rock solid
uptime or rapid feedback on a research question? Answer that and choose
deliberately. Honor the tradeoff. There is no perfect solution, only the right
compromise for now. When you are racing against a deadline, choose simplicity and
accept the dullness. When you are prototyping a radical idea, choose
sophistication and accept the technical debt. When you are building something
meant to last, choose the combination that yields reliability, even if it does not
inspire a standing ovation from your future self.

And remember: simplicity or sophistication, they are not sole measures of your
talent. They are tools you wield to shape the experience of building and
maintaining code. Master the tradeoff and you will write software that serves
its purpose without betraying your own values. Know that there is no perfect
answer. There is just the answer that works for this moment, and the honesty to
admit what you're optimizing for.

And if the answer is 'I just want to mess around and write something cool,' then
you need to own it. Just don't lie to yourself and call it a proper
architecture. [^2]

[^2]: Believe me when I say that this is self-reflection more than anything. I
    have called my own creations "solutions" when they were just experiments.
    Sure they _did_ substitute a solution for the time being, but I should have
    known it was not the way to go.
