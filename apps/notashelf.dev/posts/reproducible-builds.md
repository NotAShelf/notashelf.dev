---
title: "Reproducible Software is a Political Act"
description: "The Kind of Technoblabber you would Expect From a Political Scientist"
date: 2026-02-24
keywords: ["thoughts", "programming"]
---

Every once in a while I come across the "NixOS is not reproducible" post across
some platform posted or _re_-posted to be snarky or to get a point across. I
find the article entirely boring and shallow, of course, and I will avoid both
linking or diving into it but it gave me the idea for this post.

The idea was half-baked until a while ago, up until a somewhat recent discussion
with someone much more knowledgable in my field---Political Science---and we
have began exploring the ideas of bringing concepts from software development to
policymaking. This is important, because while software _can_ be reproducible
human behaviour cannot. Much like artificial intelligence, humans tend to
respond to identical questions with different answers depending on _way_ too
many factors (much beyond LLMs) and thus it struck me as an interesting concept
to worth exploring.

This is going to be a long post, and it's barely distilled from various trains
of thoughts so I ask that you bear with me. Admittedly I could've done a better
job by creating more than one post (and maybe I will) but I promise to you that
everything connects eventually. Nothing in this post is filler. With that said,
I wish you a good reading.

## First There Was Code

If I were to miss all the nuance and strip any kind of depth, I'd say that
software development is an incredibly simple and straightforward process where
you wrte a few lines of code, feed it to the compiler, and get an executable.

When you put it like that it _does_ feel like a straightforward mechanical
process, a simple translation from human-readable text to machine-executable
instructions. But in that brief moment of compilation, a profound philosophical
and political shift occurs. You are no longer dealing with logic; you are
dealing with faith.

Not so long ago we've narrowly avoided a catastrophic collapse via the XZ Utils
backdoor where a malicious actor spent years gaining the trust of a burnt-out
open-source maintainer and eventually slipped a highly sophisticated backdoor
into a widely used compression library. I'm mildly upset that this has come to
be, and I do feel sympathy for the burnt-out maintainer that inadvertently
allowed this to happen, but I'm more so interested in the brilliance of the
stack---which was not in the source code itself.

The backdoor, unbeknownst to some, was hidden in the _test files_ and injected
during the build process. If you read the source code repository everything
would've looked perfectly innocent, because the poison would only manifest when
the code is transformed into binary---something you'll almost never be
interested in as a downstream consumer.

Thus, we come to the terrifying realization that _auditing source code is an
illusion of security if you cannot prove the binary came from that exact
source_.

### The Philosopher's Backdoor

Before you get bored and start scrolling reels, let me remind you for a brief
second that I did not mention the "NixOS is not reproducible" post without a
reason. As consumers of software at various degrees---some more blindly and some
less willingly than others---we are _constantly_ exposed to such threats. XZ is
not an edge case, but a manifestation of one of the edge cases that came to be.
Nix itself is a _reproducible build tool_, and due to various factors at play
the XZ vulnerability was entirely avoided, [^1] but there are _many_ package
managers and build tools that do little to guarantee reproducible builds.

[^1]: This was not without teaching us a valuable lesson. While no user was
    directly affected by the XZ vulnerability, Nixpkgs still chose to roll back
    the XZ version _just to be safe_. For unstable users, the "fix" took three
    days to be effective due to Nixpkgs' caching system. As a NixOS user you
    have _all_ the necessary tooling, but lack a standardized mechanism to
    receive distributed, urgent security fixes.

To give you a better sense of the depth of this crisis, I'd like to go back to
1984 [^2] and into an insignificant lecture about a little known individual.
During his Turing Award lecture, _Reflections on Trusting Trust_, UNIX
co-creator Ken Thompson proposed a theoretical attack (which he actually
implemented) that remains one of the most chilling concepts in computer science.
He **modified a C compiler** so that whenever it compiled the `login` program,
it inserted a backdoor allowing him access. Then, he went a step further: he
modified the compiler so that whenever it compiled _a new version of itself_, it
inserted the backdoor-generating code into the new compiler. And finally, he
deleted the malicious code from the compiler's source.

The result would be that the source code for the compiler was _perfectly clean_,
and the source code for the `login` program was as well yet the resulting system
was fundamentally compromised. Indeed, this was a _theoretical_ attack vector
that, as far as I'm aware, has not been implemented but I want to point towards
the epistemological crisis that I would classify this as. Epistemology being the
branch of philosophy concerned with _how we know what we know_.

Thompson proved that in computing, you can't _know_ anything for sure unless you
wrote all the software, including the compiler and the operating system, from
scratch yourself.

### The Priesthood of the Binary

Now, why is this important? Did I just want to tell you a story about a
theoretical attack or do I have a point?

You see, because we cannot all write our own operating systems from scratch, we
rely on binaries compiled by others. This creates a political structure. When
you download a compiled application---even an open-source one---you are engaging
in an act of submission. You are submitting to the authority of the build
server. You are trusting that the developer’s machine wasn't compromised, that
the CI/CD pipeline wasn't hijacked, and that no one slipped a quiet extra line
of code into the binary before signing it. I can go on.

Historically, this has created a technological priesthood. The "priests" (tech
giants, package maintainers, build farms) hold the sacred power of compilation.
The "laity" (users) must blindly accept the artifacts handed down to them. In a
democratic digital society, "Trust me, bro" is an unacceptable governance model
for foundational infrastructure.

### Compilation as a Historical Event vs. Mathematical Truth

This is where I want to remind you about the concept and the movement for
**Reproducible Builds**, which shift from a technical pedantry to a more
_profound_ philosophical... revolution, for the lack of a better word.

By default, compilation is a _historical event_. If you compile a piece of
software today, and I compile the exact same source code tomorrow, the resulting
binaries will have different cryptographic hashes. Why? Because the compiler
absorbs the environment. It bakes in the current timestamp. It records the file
paths of the machine it was built on. It might use randomly generated unique IDs
for internal optimizations. [^3]

[^3]: I'm fully aware that this is not _always_ the case, as there is a subset
    of developers that _do_ make an effort for reproducible build without
    obscure tooling at play but _most of the time_ it is not even a concern.
    Thus, to reinforce my point I'm making a generalization. As you might know,
    anecdotal evidence is the best kind of evidence.

Because the output is always unique, a binary is a relic of a specific time and
place. It cannot be independently verified; it can only be trusted. The goal of
reproducible builds is to strip the environment out of the equation. By
standardizing build paths, forcing deterministic behavior in compilers, and
mocking timestamps (often using the `SOURCE_DATE_EPOCH` standard), developers
can ensure that compiling the same source code _always_ results in a bit-for-bit
identical binary, regardless of who compiles it, where, or when. When a build is
reproducible, compilation ceases to be a historical event and becomes a
mathematical truth.

### The Democratization of Verification

Speaking of mathematical truth, let's talk about LLMs. As you might be aware,
the copyright infringement company known as _Antrophic_[^4] has recently
introduced a C compiler _entirely_ with their frontier model, Claude, which can
compile the Linux kernel, but not a basic "Hello world" program or most
moderately advanced C programs despite costing thousands of dollars.

Why is this important? Well, with my above explanation of "priesthood" and the
concept of "mathematical" truth I'm sure you immediately grasp the point I'm
getting to, but to put it plainly I believe we have arrived as a less
deterministic environment, even less than before, where entropy is not only in
the build result but also in the source.

[^4]: If anyone wishes to challenge this label, please bring me the receipt for
    every purchase and the resulting training data. I would be happy to revise
    my claim then, maybe something to less tame such as "indeterministic
    warcrime company" or something.

The social and political implications of this shift are massive. If a build is
reproducible, we no longer need a priesthood. Not only do we not _need_ one, but
I think it is about time we actively reject it.

Anyone with a laptop can download the source code, run the compiler, and hash
the resulting binary. If their hash matches the hash of the binary provided by
the official maintainer, cryptographic proof is established: _No one tampered
with this binary._ The chain of trust is broken and replaced with a web of
independent, decentralized verification. It is the scientific
method---reproducibility of results---applied to software distribution.

As software eats the world, governing everything from our banking systems to our
pacemakers and our voting machines, the gap between source code and binary is
the most dangerous shadow in modern society. Reproducible software isn't just
about catching bugs; it’s about aligning our digital infrastructure with the
democratic ideals of transparency, accountability, and verifiable truth.

It is the ultimate defense against the dark arts of the digital age.
