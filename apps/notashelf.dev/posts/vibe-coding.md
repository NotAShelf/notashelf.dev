---
title: "I am Not Convinced By Vibe Coding"
description: "A Critique of Vibe Coding and its False Promise of Effortless Software Development."
date: 2025-04-07
keywords: ["thoughts", "software", "programming"]
---

# I am Not Convinced By Vibe Coding

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

But I'm not convinced. Not because I'm a Luddite, or because I'm resistant to
change. I _have_ used these tools (at least I tried to) and I _do_ understand
their appeal. What I reject is the framing that this is a sustainable or
revolutionary new paradigm for software development. It's not. It's a generator
of noise with occasional signals, and it relies entirely on your ability to tell
the difference. What happens when you _can't_ tell the difference?

## The Machine That Designed Cars

There's a plot point in the book The Dice Man [^1] that I keep returning to. At
one point, a team invents a machine that generates car designs entirely at
random. Millions of iterations, nonsensical and broken and unbuildable---but
every once in a while, a design emerges that is striking. Beautiful, even. So
they discard the garbage and hand-pick the good ones.

[^1]: Or maybe its sequel, The Son Of Dice Man? It's been years since I read the
    books...

That's what vibe coding is. You prompt an AI a hundred times, throw away the
malformed outputs, and keep the one that works, at least on the surface. It
looks right. It runs. The UI renders. The button clicks. Success, right?

But in software, the internal structure matters. Code is not just visual. It is
layered with behavior, security, data access, side effects, and edge cases. You
are not choosing car sketches for a brochure; you are selecting an actual
vehicle that someone will drive. And if you don't understand what's under the
hood, you are gambling with your user's safety.

## What Vibe Coding Forgets

Proponents of vibe coding frame it as a democratizing force. You don't need to
know how it works. Just ask for what you want. Let the machine handle the
implementation.

This sounds empowering, but it breaks down under scrutiny. The truth is, someone
always has to understand the code. The difference is whether it's you,
_now_---or the unfortunate engineer later, during an incident response, staring
at a mess of AI-generated spaghetti with no documentation and zero tests. That
is if you are lucky, what if someone malicious gets their hands on your vibe
coded SaaS?

Blindly trusting generated code without review or comprehension is not
engineering. It’s aesthetic selection. The entire method hinges on your ability
to recognize what’s good—but good on what axis? Speed? Readability? Robustness?
Security? These aren’t things you can judge from a glance. They take context.
They take understanding.

## The Shortcut That Becomes a Detour

Yes, vibe coding accelerates prototyping. Yes, it lowers the floor for
experimentation. But we have to stop pretending that this comes without
tradeoffs. You are accumulating technical debt at warp speed. You are
outsourcing logic to a model trained on GitHub, filled with every security
mistake and anti-pattern known to man. What, you thought it was trained on
_good_ code? Pfft.

Worse, you may not even notice. The very act of vibe coding discourages
investigation. You didn't write this code. You don't own it. You don't feel
responsible for it. If it breaks, you will just prompt again. But that's not
development. That's gambling at best. Desperation at worst.

## When Vibe Coding Makes Sense

There is a place for vibe coding. It's a great tool for demos, internal tooling,
or disposable experiments. If you are hacking something together for a one-time
presentation, the speed is hard to beat.

But that's a narrow domain. The moment your software has users, state, uptime
requirements, or a security surface, you are in a different game. At that point,
the vibe must end. You need understanding. You need rigor. You need systems that
are legible, testable, and maintainable.

## You Cannot Abdicate Responsibility

Software is not magic. It's logic encoded for machines and maintained by humans.
Tools like Copilot, Cursor, Claude, and GPT are useful, but they are assistants,
not replacements. Using them well requires clarity, not vibes.

We don't need to throw out our understanding to embrace the future. We need to
carry it forward. Otherwise, we're not building---we're browsing. And the cost
of mistaking one for the other is always paid in production.

## Closing Thoughts

It is not my intention to gatekeep anyone from doing anything. I avoid LLMs by
principle, but that is a choice I do not enforce on anyone. It also stems from
the fact that I get disappointed every time I tell Claude to do something for
me. Maybe I'm unlucky, who knows? My point here is that no matter how the app
was coded (though especially if it's _vibe_ coded) then you have the moral
responsibility to understand it before you ship it. When I see an app that
proudly boats that it was vibe coded, I turn around and pretend the repo does
not exist. Not because I feel a moral superiority by doing so, but I am not
willing to take the chance. After years of programming, I would like to _think_
that humans programmers inherently target or at least document
production-critical bugs, whereas LLMs choose to put env vars in production
code. Sure we all know better than that, but what if you make a mistake you
can't even recognize?

This has been my miniature rant on vibe coding. I was exposed to "AI slop" while
in academia, and all it has done to serve me was a whole lot of annoyance. Sure,
don't think I guess.
