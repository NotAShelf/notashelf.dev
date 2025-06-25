---
title: "I am Not Convinced By Vibe Coding"
description: "A Critique of Vibe Coding and its False Promise of Effortless Software Development."
date: 2025-08-02
keywords: ["thoughts", "software", "programming"]
---

There has been some growing current of enthusiasm recently, around so called
vibe "coding." To those of you unfamiliar with the term, if that is even
possible, vibe coding refers to a software development mode where instead of
writing code directly, developers interact with large language models (LLMs)
using prompts, voice, or vague intent. The tools generate code, and the human
nudges it back and forth by feeling---by vibe, they say---until it works.

The promise is seductive: anyone can build an app, and you don't even need to
know programming! Prototypes come together in a weekend. Codebases emerge not
from typing but from suggestion, improvisation, and iteration. The developer
becomes a kind of conductor, gesturing at the machine to summon form from
possibility.

I am, however, not entirely convinced. Not because I'm a Luddite, or because I'm
resistant to change. I _have_ used these tools (at least I tried to) and I _do_
understand their appeal. What I reject is the framing that this is a sustainable
or revolutionary new paradigm for software development. It's not. It's a
generator of noise with occasional signals, and it relies entirely on your
ability to tell the difference. What happens when you _can't_ tell the
difference? Have you really accounted for that?

## The Machine That Designed Cars

There's a plot point in the book The Dice Man [^1] that I keep returning to. At
one point, a team invents a machine that generates car designs entirely at
random. Millions of iterations, nonsensical and broken and unbuildable---but
every once in a while, a design emerges that is striking. Beautiful, even. So
they discard the garbage and hand-pick the good ones.

[^1]: Or maybe its sequel, The Son Of Dice Man? It's been years since I read the
    books...

That's what I vibe coding to be. You prompt an AI a hundred times, throw away
the malformed outputs, and keep the one that works, at least on the surface. It
looks right. It runs. The UI renders. The button clicks. Success, right?

I think this comes from the fact that software programming having fewer win
conditions. While in most domains a "win condition" is some universally
recognized state of victory---e.g., in chess, it's checkmate; in biology, it's a
Nobel-worthy discovery; in sports, it’s a gold medal--- programming has _no
universal definition of "done right"_, [^2] _no standard of elegance that
everyone agrees on_ and _no fixed endpoint_. Hell, even shipping a product
doesn't mean you "won." There are always bugs, tech debt, UX complaints,
performance ceilings, etc. Even "perfect code" is usually replaced or rewritten
within a decade.

[^2]: No matter what the grifters on tech Twitter will tell you, there simply
    isn't one.

As such the internal structure matters. Code is not just visual. It is layered
with behavior, security, data access, side effects, and edge cases. You are not
choosing car sketches for a brochure; you are selecting an actual vehicle that
someone will drive. And if you don't understand what's under the hood, you are
gambling with your user's safety.

## What Vibe Coding Forgets

Proponents of vibe coding frame it as a democratizing force. Claiming that you
do _not_ need to know how it works, and that you can just explain what you want
to the machine. Let the machine handle it. This _does_ sound empowering to a
degree, but it also breaks down under scrutiny. Truth is, someone will always
have to understand the code. The difference is whether it's you _now_, or an
unfortunate engineer, a curious security researcher or a malicious party down
the road. Biggest question here is, what if someone malicious gets their hands
on your vibe coded SaaS?

Blindly trusting generated code without review or comprehension is not
engineering, it is nowhere near that. In fact, I think it is something to be
ashamed of. The pride tied to the fact that you do not understand something
is... tragic. I can only describe (most cases of) vibe coding as "aesthetic
selection". The entire method hinges on your ability to recognize what’s good or
most of then good _looking_---but good on what axis? Speed? Readability?
Robustness? Security? These are nto things you can judge from a glance. They
take context. They take understanding.

## The Shortcut That Becomes a Detour

I'll be honest, yes vibe coding _does_ accelerate prototyping. Yes, it also
lowers the floor for experimentation. But we have to stop pretending that this
comes without trade-offs. You are accumulating technical debt at warp speed. You
are outsourcing logic to a model trained on GitHub, filled with every security
mistake and anti-pattern known to man. What, you thought it was trained on
_good_ code? Hah.

Worse, you may not even notice. The very act of vibe coding discourages
investigation. You didn't write this code. You don't own it. You don't feel
responsible for it. If it breaks, you will just prompt again. But that's not
development. That's gambling at best. Desperation at worst. Even if you are
someone who understands the principles of programming, which is a safer than
most use cases I have witnessed, it still gives you tunnel vision to a degree
unless you had a perfectly outlined plan from the start. Unless you know what
_exactly_ you were going for, then you are letting a subpar sentence generator
decide what will be happening in your project. Even if you reject its proposals,
it will plant the seeds of an idea in your head.

## When Vibe Coding Makes Sense

I think there is a place for vibe coding. Or rather, AI-assisted programming. I
reject the idea of prompting a sentence generator to have what I can do better
while also enjoying the process. It can be a great tool for demos, quick and
hacky scripts, or even internal tooling if the risk is acceptable. If you are
hacking something together for one-time use or just a presentation, the speed is
hard to beat. Though you must also realize that the domain is very narrow. The
moment your software has users, state, uptime requirements, or a security
surface, you are in a different game. At that point, the vibe must end. You need
understanding. You need rigor. You need systems that are legible, testable, and
maintainable.

### You Cannot Abdicate Responsibility

No matter how arcane it looks, software is not magic. It is logic encoded for
machines and maintained by humans. Tools like Copilot, Cursor or models like
Claude and Gemini may be useful but it must be made perfectly clear that their
use case is acting as assistants, not replacements. Using them well requires
clarity, and not vibes.

What I take issue with in the usage of such tools are I do not trust must
developers to draw the line clearly. The most common and dare I say natural
response to the task often is something along the lines of "well I used it for
prototyping and it worked, it can probably handle the production code as well"
and to me that violates a contract of trust.

When I use software made by another person, I trust in their moral judgement and
the potential consequences on a personal level. If a software programmer makes a
mistake that causes my home directory to be deleted, they will feel remorse.
They will also aim to never make that mistake again. What about LLMs? It'll give
you an empty apology, fix its mistake for one time and move on. Will you always
check the code in case if it accidentally deletes your users home directory
again?

Thus I want to say that we do not need to throw out our understanding to embrace
the future. We need to carry it forward. Celebrate the collective intelligence,
experience and effort. Otherwise, we're not building---we're browsing. The cost
of mistaking one for the other is always paid in production.

### You Cannot Deny

## Closing Thoughts

It is not my intention to gatekeep anyone from doing anything. I avoid LLMs by
principle, but that is a personal choice that I do not and cannot enforce on
anyone. It also stems from the fact that I have only had disappointing
experiences with tools like Claude. I tell it to do something, and it makes
outrageous assumptions about my codebase or straight up tries to throw something
away because it collides with its own shallow implementation. Maybe I'm unlucky
though, who knows?

The point I really wanted to make in this post is that no matter how the app was
coded (but especially if it was _vibe_ coded) then you have a moral
responsibility to understand it before yous hip it. When I see something that
boasts being written by LLMs, I tend to turn away and pretend that the repo does
not exist. Not because I feel a moral superiority by doing so, it was never
about that, but because I am not willing to take the chances of getting caught
be a destructive oversight no human developer would make. After years of
programming, I would like to _think_ that humans programmers inherently target
or at least document production-critical bugs, whereas LLMs choose to put env
vars in production code. Sure we all know better than that, but what if you make
a mistake you can't even recognize?

Lastly there is the part of effort. When I see an art piece that I like, it is
not just about the art itself but also the time spent on the piece. I _respect_
the artist as much as I _enjoy_ their art. When the piece is good but there is
no time behind it, the level of my enjoyment only goes down. Sure you might have
expressed an idea, but what about the journey? What have you gained out of this
except for a potentially malformed artwork that is the expression of words
instead of feelings?

This has been my miniature rant on vibe coding. Truth be told, I was exposed to
"AI slop" more often than I'd like while in academia, and all it has done to
serve me was to get on my nerves. Waste my time. Sure, don't think I guess. That
said, I do not reject the idea outright. I believe there is merit in AI-assisted
code reviews or project planning. Not yet though, at least not until the hype
bubble pops. Hope you enjoyed this writing. It was more emotional than the rest
of my writing, and I'd like to hear your thoughts. If you think I've missed
anything, I'm also open to further discussion.
