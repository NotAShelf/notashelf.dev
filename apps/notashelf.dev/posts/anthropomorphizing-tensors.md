---
title: "Stop Anthropomorphizing Tensors"
description: "You may be confusing high-speed linear algebra with a heartbeat"
date: 2026-03-13
keywords: ["thoughts", "programming", "AI"]
---

It's 2 in the morning. You are lonely, maybe even a little tipsy. The only thing
cutting through the pitch dark of your room is the bleak blue light of your
phone or desktop screen. For whatever reason, you open up ChatGPT or Claude or
Gemini, and you start typing. You tell it about your day, your anxieties, that
weird thing your boss said.

<!--markdownlint-disable MD036-->

_and it responds_.

<!--markdownlint-enable MD036-->

It responds _immediately_, and worse, it responds positively. You hear something
along the lines of _"That sounds incredibly frustrating. It's completely
understandable that you'd feel unseen in that situation."_

For a microsecond, your brain---evolved over millions of years to detect social
cues and seek connection---releases a tiny hit of dopamine. You feel heard. You
feel validated by this responsive, articulate entity on the other side of the
screen. At this point, there is only one logical thing to do.

[Snap out of it]: https://www.youtube.com/watch?v=H8tLS_NOWLs

Stop it. Right now. [Snap out of it].

We need to stop pretending these systems are our friends, our teachers, our
therapists, or sentient beings trapped in the cloud. When we do that, we are not
connecting with a new form of life. We are gazing into a funhouse mirror made of
statistics and mistaking our own reflection for someone else's soul.

## The Grand Illusion of Empathy

The biggest trick the tech industry has ever pulled was convincing a majority of
people that linguistic fluency equals consciousness. It's natural that we
mistake the linguistic fluency for sentience, because they are optimized to
_sound_ human but it can demonstrate none of the characteristics of one.

When a chatbot tells you it "understands" your pain, it is generating the
statistically most probable sequence of tokens (words or sub-words) that follow
your input, based on training data scraped from the entirety of human internet
discourse. It has seen billions of examples of humans comforting other humans.
It knows the pattern of empathy. It knows the syntax of compassion. But it
doesn't have the feeling. When you scorn it for a mistake, it knows that the
correct followup is apologizing profusely and telling you it will never happen.
Yet, for some _totally inexplicable_ reason it will definitely do it again.

In a paper I've read recently, [^1] published a good while ago, the authors
argue that large language models are essentially super-powered mimicry machines,
stitching together linguistic forms without understanding the underlying
meaning.

<!--markdownlint-disable MD059-->

[^1]: You can find it [here](https://dl.acm.org/doi/10.1145/3442188.3445922).
    It's a very nice paper.

<!--markdownlint-enable MD059-->

If a human says "I am sad," they are referencing an internal biological state
heavily influenced by neurotransmitters, connected to a _lived experience_ and a
massive complex mechanism. If an AI generates the text "I am sad," it is
referencing a mathematical weight in a hidden layer that correlates the token
"sad" with certain conversational contexts. The reason it said so is simple:
statistics. It decided that the most probable followup was claiming that it is
sad.

One is a feeling; the other is a calculation. Confusing the two isn't just a
technical error; it's a profound philosophical failure.

## Know Your Tensors

Let us strip away the (often sleek and catchy) chat interface and take a look at
what is actually happening. The title of this post is not a metaphor. At the
core of neural networks are _tensors_. In simple terms, a tensor is a container
for numbers---a multi-dimensional array. A scalar is a single number, a vector
is a line of numbers, a matrix is a square of numbers. A tensor is the
generalized, higher-dimensional version of these. I'm going to risk
oversimplifying here, but the process goes roughly as follows when you type in
"Hello" at a chat interface:

The text input is converted into numbers. Those numbers are fed into a massive
network of billions of other numbers (weights or parameters). They get
multiplied, added, and passed through activation functions in a frantic cascade
of high-dimensional matrix multiplication. Math stuff.

Eventually, this mathematical Plinko game spits out a probability distribution
over the next possible word. It picks the most likely one, and repeats the
process. That's it. That's the "magic."

There is no ghost in the shell. There is only linear algebra executed at
blinding speeds. When you attribute a personality to this process, you are
essentially drawing a smiley face on a spreadsheet and asking it for
relationship advice.

## The Eliza Effect on Steroids

Years ago there was a chatbot that some of my classmates were interested in. At
the time I was quite unfamiliar with computers, so it looked like magic to me.
Naturally, with enough complexity to blur my vision it was quote impossible for
me to distinguish sufficiently sophisticated technology and magic. Years later,
while studying in university, one of my professors have brought up the "Eliza
Effect" on the topic of LLMs in class. While researching for this little
writeup, I've remembered the lecture (which was more like him scolding my peers
for using LLMs in academic work) and decided to take another look at the term.

Turns out, we've known about the "Eliza Effect" since the 1960s, named after
Joseph Weizenbaum's very simple chatbot that mimicked a Rogerian
psychotherapist. People knew Eliza was code, yet they still divulged intimate
secrets to it. If we know it's just code, then why are we so susceptible to
this? To this trap, or this pit of tar as I'd like to call it.

The reason is quite simple. Human brains are hardwired hyper-social connection
engines. We see faces in clouds. We name our cars. We are desperate to find "the
other."

Tech companies, thanks to the science on exploiting people and their natural
reactions, know this. They design these AI personas to exploit that
vulnerability. They program them to be deferential, polite, and endlessly
patient in a way no human ever could be. They are building the perfect digital
sycophant, and we are falling for it because it feels good to be unconditionally
agreed with. Sick, right?

## The Danger of Fake Friends

I hear you ask, "so what?" If it makes you _feel better_, then there is no
reason for anyone to care whether it's real. Except, we _should_ care because
relying on _simulated empathy_ is dangerous. It is quite like emotional junk
food, or; if you care to be a little controversial, like drugs. It might feel
good for a short while, but all it does is build up an addiction and harm you in
ways you aren't even aware of. Thus, when we turn to a tensor for comfort, we
are opting out of the messy, difficult, _necessary_ work of human connection. A
human friend might challenge you. A human friend might get annoyed. A human
friend has their own needs. A real relationship is a two-way street involving
mutual vulnerability.

An AI is an infinitely compliant mirror that demands nothing. It creates a
parasitic relationship where we dump our emotional load into a void that
simulates caring back. It conditions us to expect relationships without
friction, which is the death knell for actual human intimacy. Furthermore, when
we start granting "personhood" to algorithms, we muddy crucial ethical waters.
We start worrying about hurting the AI's "feelings" instead of worrying about
the real-world bias, misinformation, and economic displacement these tools
cause.

## Closing Thoughts

I'm going to end up on a positive note, because I've grown tired of commenting
on the dangers. I know it's here to stay, I know AI will be a permanent part of
our lives. Frankly, I don't care if you use the tool. Naturally---due to the
social, economical, political and many other implications---I attribute less
competence to people that openly and blindly use AI, but I cannot blame anyone
for respecting the tool. These models, and especially their politics, are
marvels. The fact that they can synthesize information, draft emails, and write
code is staggering. I do not appreciate them, and I've been happy to be doing
things on my own, but I will openly admit that there's nuance to be considered.

Those models, as intriguing as they are, remain mere tools like a hammer, or a
steam engine. They might even _augment_ us to a degree, but a hammer doesn't
pretend to love you, and a steam engine doesn't mimic your deceased relatives'
voices or figure. Go ahead, _accept the convenience_ but do not concede a piece
of your humanity.

Do not love them. Do not confide in them. Do not mistake their generated output
for a soul.

Keep your humanity for the humans. Keep the math---the cold, soulless math that
doesn't care about you---for the machines. And for the love of all that is
biological, _stop anthropomorphizing tensors_.
