---
title: "I am Not Convinced by Vibe Coding"
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

The assumption that the technology alone solves the entire problem overlooks the
complexity embedded in software development beyond mere code generation.

## The Machine That Designed Cars

There's a plot point in the book The Dice Man [^1] that I keep returning to. At
one point, a team invents a machine that generates car designs entirely at
random. Millions of iterations, nonsensical and broken and unbuildable---but
every once in a while, a design emerges that is striking. Beautiful, even. So
they discard the garbage and hand-pick the good ones.

[^1]: Or maybe its sequel, The Son of Dice Man? It's been years since I read the
    books...

That's what I find vibe coding to be. You prompt an AI a hundred times, throw
away the malformed outputs, and keep the one that works, at least on the
surface. It looks right. It runs. The UI renders. The button clicks. Success,
right?

I think this misconception, so to speak, comes from the fact that software
programming has fewer win conditions. While in most domains a "win condition" is
some universally recognized state of victory---e.g., in chess, it's checkmate;
in biology, it's a Nobel-worthy discovery; in sports, it’s a gold
medal---programming has _no universal definition of "done right"_, [^2] _no
standard of elegance that everyone agrees on_ and _no fixed endpoint_. Hell,
even shipping a product doesn't mean you "won." There are always bugs, tech
debt, UX complaints, performance ceilings, etc. Even "perfect code" is usually
replaced or rewritten within a decade.

[^2]: No matter what the grifters on tech Twitter will tell you, there simply
    isn't one.

As such the internal structure matters. Code is not just visual. It is layered
with behavior, security, data access, side effects, and edge cases. You are not
choosing car sketches for a brochure; you are selecting an actual vehicle that
someone will drive. And if you don't understand what's under the hood, you are
gambling with your users' safety. The belief that AI-generated code can be
blindly trusted because it "builds and runs" dismisses these hidden complexities
and the inherent unpredictability of probabilistic models. Treating generated
code as a finished product rather than a draft invites risk.

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
selection". The entire method hinges on your ability to recognize what is good
or most of the time good _looking_, but good on what axis? Speed? Readability?
Robustness? Security? These are not things you can judge from a glance. They
take context. They take understanding.

Relying on AI as a catch-all acceleration tool ignores the essential nature of
software as a system. Speed without comprehension leads to fragility and
technical debt. The supposed gains are only superficial if the foundational
integrity of the codebase is compromised.

## The Shortcut That Becomes a Detour

I'll be honest; yes, vibe coding _does_ accelerate prototyping. Yes, it also
lowers the floor for experimentation. But we have to stop pretending that this
comes without trade-offs. You are accumulating technical debt at warp speed. You
are outsourcing logic to a model trained on GitHub, filled with every security
mistake and anti-pattern known to man. What, you thought it was trained on
_good_ code? Hah.

Worse, you may not even notice. The very act of vibe coding discourages
investigation. You didn't write this code. You don't own it. You don't feel
responsible for it. If it breaks, you will just prompt again. But that's not
development. That's gambling at best. Desperation at worst. Even if you are
someone who understands the principles of programming, which is safer than most
use cases I have witnessed, it still gives you tunnel vision to a degree unless
you had a perfectly outlined plan from the start. Unless you know what _exactly_
you were going for, then you are letting a subpar sentence generator decide what
will be happening in your project. Even if you reject its proposals, it will
plant the seeds of an idea in your head.

This mindset assumes that the code is only a surface-level artifact and ignores
that true software development involves maintaining systems, anticipating edge
cases, and managing complexity. The idea that one can simply "iterate until it
works" neglects the institutional knowledge and discipline required to sustain
software over time.

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

The excitement around these tools often ignores that they require significant
infrastructure: embedding the codebase, hooking into CI pipelines, and layering
tests and linting to catch AI hallucinations. These are not trivial tasks, and
most teams are not equipped to treat AI as a dependable collaborator rather than
a toy.

### You Cannot Abdicate Responsibility

No matter how arcane it looks, software is not magic. It is logic encoded for
machines and maintained by humans. Tools like Copilot, Cursor or models like
Claude and Gemini may be useful but it must be made perfectly clear that their
use case is acting as assistants, not replacements. Using them well requires
clarity, and not vibes.

What I take issue with in the usage of such tools is that I **do not trust**
most developers to draw the line clearly. The most common and dare I say natural
response to the task often is something along the lines of "_Well I used it for
prototyping and it worked. It can probably handle the production code as well_"
and to me that violates a contract of trust.

When I use software made by another person, I trust in their moral judgement and
the potential consequences on a personal level. If a software programmer makes a
mistake that causes my home directory to be deleted, they will feel remorse.
They will also aim to never make that mistake again. What about LLMs? It'll give
you an empty apology, fix its mistake for one time and move on. Will you always
check the code in case it accidentally deletes your user's home directory again?

Thus I want to say that we do not need to throw out our understanding to embrace
the future. We need to carry it forward. Celebrate the collective intelligence,
experience and effort. Otherwise, we're not building; we are merely browsing.
The cost of mistaking one for the other is always paid in production.

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
responsibility to understand it before you ship it. When I see something that
boasts being written by LLMs, I tend to turn away and pretend that the repo does
not exist. Not because I feel a moral superiority by doing so, it was never
about that, but because I am not willing to take the chances of getting caught
by a destructive oversight no human developer would make. After years of
programming, I would like to _think_ that human programmers inherently target or
at least document production-critical bugs, whereas LLMs choose to put
environment variables in production code. Sure we all know better than that, but
what if you make a mistake you can't even recognize? Can AI learn from its
mistakes? I don't think so.

Lastly there is the part of effort. When I see an art piece that I like, it is
not just about the art itself but also the time spent on the piece. I _respect_
the artist as much as I _enjoy_ their art. If the piece is good, but I _know_
the artist has spent no time on the piece, then my respect for the artwork and
thus the level of my enjoyment only goes down. Sure you might have expressed an
idea, but what about the journey? What have you gained out of this except for a
potentially malformed artwork that is the expression of words instead of
feelings? What am I even looking at? There is no beauty here, just lines. Vibe
coding is very similar in principle. Yes most enterprise code is for the sake of
completing a task, and doing so while making or saving the company money but
what about FOSS? What happens to the individuality, to the collaborative
creative wisdom of the people? Deferring inventing to AI is nothing but
reductive. It can _never_ be anything but reductive. This is not pragmatism. [^3]

[^3]: If you mention driving a car or using printing presses to replace walking
    and printing, I will simply defenestrate you. You _know_ those things are
    not equal, and you KNOW that they solve problems of capacity. You cannot
    walk a thousand miles, even if you could the time spent would not be worth
    it. One man cannot copy a million books, even if he did it would take a
    lifetime. One developer, however, solve write one hundred projects. A
    thousand. AI only makes it less incentivized to think on those projects.

---

This has been my miniature rant on vibe coding. Truth be told, I was exposed to
"AI slop" more often than I'd like while in academia, and all it has done to
serve me was to get on my nerves. Waste my time. Sure, don't think I guess. That
said, I do not reject the idea outright. I believe there is merit in AI-assisted
code reviews or project planning. Not yet though, at least not until the hype
bubble pops. Hope you enjoyed this post. It was more emotional than the rest of
my writing, and I'd like to hear your thoughts. If you think I've missed
anything, I'm also open to further discussion.

[One of them]: https://advancesinsimulation.biomedcentral.com/articles/10.1186/s41077-025-00350-6
[The second study]: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/

I want to leave you with two interesting studies. [One of them] is on the
AI-assisted academic writing and recommendations for ethical use. While ethics
are whole new discussion point that I want to avoid, the practicality of AI is
an interesting question. It is a relatively short read, so I recommend that you
give it at least a skim. Especially if you are a student. [The second study] is
on the impact of AI on developers in 2025. It challenges some of the baseless
assumptions usually perpetuated by those that stand to gain from perpetuating
the unseen (but somehow very real) productivity boost of AI in enterprise. If
you would like a real statistical study (that you can pull out next time someone
tells you that "AI makes developers faster, trust me") then I recommend you take
a look at this one as well. If you have some other interesting articles, please
feel free to contact me to let me know.

Cheers!
