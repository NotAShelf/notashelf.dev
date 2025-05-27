---
title: "The Tradeoff Tarp"
description: "When Simplicity Feels Like Surrender"
date: 2025-05-28
keywords: ["thoughts", "software", "programming"]
---

# The Tradeoff Trap

I spent the last few days adding a new component to my site. It's written in
Rust, compiled to WASM, and shoehorned into my Astro stack through a Vite plugin
that I probably regret now. It works, technically. But it's not clean. It's not
even clever. It’s just... heavy. [^1]

[^1]: And the performance benefits aren't even that great! What happened to my
    blazingly fast memory safe Rust?

This whole thing started because I wanted to fix something small. But as usual,
I ended up dragging the rest of the codebase into it like a black hole pulling
in nearby stars. Old components got rewritten. New abstractions were born and
killed in the same evening. I opened a second terminal window just to keep track
of my regrets.

And somewhere in the middle of this mess, I remembered when my site was a single
text file. A .txt dumped into /var/www/html and served by NGINX. No JavaScript.
No build step. No decisions. It just was.

So how the hell did I end up here?

## The Itch That Builds Complexity

I can still remember the night I rewrote a utility three times. First version:
30 minutes, dead simple, rock solid. Second version: three hours of reactive
garbage and decorators that made the call stack look like performance art. Third
version: a weird hybrid that used a language feature I had to re-learn every
time I saw it. None of them felt right. I hated all of them. And not in the
funny self-deprecating way. I mean actual disgust. Because none of them
satisfied both sides of me: the builder and the tinkerer.

I get this itch when I write code that's too simple. You probably do too. It's
that little voice that says: you could be more clever than this. You could
abstract this. You could invent something novel. It’s not about what the code
needs. It’s about what you need: a little shot of novelty, a way to prove that
you still know how to do something slightly absurd. And sure, I tell myself it's
for maintainers. Future contributors. Elegance. But the truth? I do it for
myself. For the thrill of wrapping a problem in something unnecessarily
beautiful.

## The Joy Tax

Truth be told, Joy matters. Joy drives creativity. But it comes with a tax. Joy
tells you that layering three patterns on top of each other is fine because you
will _totally_ clean it up later. Joy tells you you're learning. And sometimes
that's true. But more often, it leaves behind a breadcrumb trail of entropy.
Small complications that add up over time until you're afraid to touch anything
without a full test suite and a stiff drink.

Simplicity, on the other hand, is power. A loop. A few conditionals. No clever
tricks. No helper macros that magically know what context you're in. Just boring
code. And I mean that in the best way. Boring code runs fast. It fits in your
head. It does not surprise you six months later.It might look uninspired but it
has its own power. Simplicity means you can revisit it months later and feel
like you understand it immediately. It means fewer bugs and fewer performance
surprises. A plain solution usually uses less memory and runs faster without
requiring a profiler.

Yet there is this intriguing feeling. Simplicity feels like surrender. It feels
like admitting the challenge was too difficult to rise to. Maybe wee fear
judgement for writing something that looks pedestrian. We call it _boring_ code
instead of reliable code. We convince ourselves that plain means uninspired when
in reality it often means practical and predictable.

## A Fork in the Road

Projects come in two broad flavors. You either get the reliable, boring version
that just works and feels like a spreadsheet with a keyboard. Or you build
something expressive and brilliant that collapses under its own weight the
moment your attention shifts.

Neither path is inherently better. What matters is context. A tiny service that
processes thousands of requests per second deserves minimal overhead. Pull in
fewer dependencies and write code that can be understood with a single glance.
In that space every millisecond counts and every external library is a
liability. You need the plain solution.

By contrast a research prototype meant to explore an idea might not care about
raw performance. It _might_ benefit from dynamic typing or metaprogramming even
if that code will never see production. In that realm the joy of creativity and
the speed of iteration trump long term maintenance. The cost of rewriting from
scratch is acceptable because you will probably scrap it once you learn what
works. The cost of learning something new is far less than missing new
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
stands and deal with the mess later. There’s nothing noble about always choosing
one tool.

Sometimes the best path forward is plain. Your code will not sparkle, but it
might just hum along quietly without any unpleasant surprises. Alternatively,
the best path forward might just be _intricate_. Your code may creak under
pressure but it will teach you things you could never learn with a toy example.
Neither choice diminishes you as a coder. Both are valid expressions of craft.

So the next time you stand at that crossroads pause before you reach for the
clever trick. Ask yourself what you truly need from this project. Do you need
speed or delight in playing with language features? Do you need rock solid
uptime or rapid feedback on a research question? Answer that and choose
deliberately. Honor the tradeoff. There is no perfect solution only the right
compromise for now.

When you are racing against a deadline choose simplicity and accept the
dullness. When you are prototyping a radical idea choose sophistication and
accept the technical debt. When you are building something meant to last choose
the combination that yields reliability even if it does not inspire a standing
ovation from your future self.

And remember: simplicity or sophistication they are not sole measures of your
talent. They are tools you wield to shape the experience of building and
maintaining code. Master the tradeoff and you will write software that serves
its purpose without betraying your own values. Know that there is no perfect
answer. There is just the answer that works for this moment and the honesty to
admit what you're optimizing for.

And if the answer is I just want to mess around and write something cool, then
you need to own it. Just don't lie to yourself and call it a proper
architecture. [^2]

[^2]: Believe me when I say that this is self-reflection more than anything. I
    have called my own creations "solutions" when they were just experiments.
    Sure they _did_ substitute a solution, for the time being, but I should have
    known it was not the way to go.
