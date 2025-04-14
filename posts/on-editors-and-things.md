---
title: "On Editors and Things"
description: "Heartfelt ramblings about available editors"
date: 2025-03-11
keywords: ["software", "neovim", "news"]
---

# On Editors and Things

Hi all, good news first. I am a **Release Editor for NixOS 25.05**. This is a
bit difficult for me to talk about, since I do not know what exactly what it
entails _yet_ but know that I am excited about it, and I wanted to share it with
you dear reader. It has been one _hell_ of a journey so far, I am excited to see
what is to come. NixOS, with its flaws, has a special place in my heart and it
is great to be able to finally play a part in the grand scheme of things.

There are a few articles that I am working on, one of them being the
continuation to the NixOS hardening series. Unfortunately there is not much time
on my hands, and my backlog is filling up again. Worry not though, they are
coming along nicely. I also have some technical rants on the horizon, since I
have not written one of those in a while. Until I get the time to finish those,
enjoy this heart-felt rambling on editors and the heart-to-heart in an unusual
pace.

## On Editors

I do a lot of, well, editing on my computer. This is sometimes for academic
essays that I have to write myself, or sometimes academic essays that I have to
proofread but it usually involves me sitting in front of a computer screen for
hours on end and simply type away. Thanks to the relative leniency of my
department, I have been able to use LaTeX in the past and more recently I have
been enjoying [Typst](https://typst.app). Much of this editing, regardless of
the framework, involves an editor. While would be all too simple to use
something like Libreoffice, I rarely find myself opening `.docx` files to edit
an essay, even less rare to be writing in one. What I use for most of my editing
is, of course, my trusty Neovim setup.

Neovim holds an interesting place in my tool belt. I have switched off
VSCode--the editor I have started with-- due to its annoyingly high RAM usage
and power draw on my laptop, which made it less than ideal for when I could not
easily find a place to plug my charger. Around the same time I was learning
about Linux (and customizing the hell out of my Archlinux setup) so it
eventually lead to me checking out Neovim. It was something reminiscent of love
at first sight. It was all snappy and intuitive and simple, I could not have
asked for a better editor. Neovim _was_ what I was looking for.

Over time I began adding plugins, usually to add features that I was missing
from VSCode. LSPs and debugger plugins quickly found their way into my
configuration, and over time Neovim was not quite what it first was. It had
become sluggish, and complex. Worse, it had become inconsistent with the number
of plugins that all insist that their way of doings things is the correct one.
Around this time, I switched to NixOS and began thinking about setting up Neovim
declaratively on my system. `programs.neovim` was not quite intuitive, and
linking a `nvim` directory to `~/.config/nvim` felt less than ideal. This lead
to _neovim-flake_. I cannot quite call it my creation, as I have soft-forked it
from a project with the same name by Jordan Isaacs but I had many different,
conflicting ideas in mind. So much so, that it warranted the soft-fork to take
it in a different direction. neovim-flake, the original one, was a learning
experience. I learned a lot about how to write Nix, and I also learned how _not_
to write Nix. [^1]

> A not-so-recent discovery that I have made is that I learn by doing.
> _Explicitly_ by doing. Little bit (a lot) of research later, I found the state
> of academia to be be... disappointing, to say the least. There is a need for
> greater adoption of evidence-based cognitive learning strategies in
> educational settings and despite their proven effectiveness, teacher training
> programs often do not appear to be covering any cognitive learning processes.
> This, unfortunately, leads to many students (such as myself) distancing
> themselves from the education system entirely. Although I do not feel equipped
> to do more than just to observe. If you _are_, however, an expert in the field
> perhaps reach out to me. I would love to hear about your thoughts as well.

As I was saying, neovim-flake--now nvf--was a learning experience. More
importantly, it was a testing ground for my "ideal" Neovim configuration. I have
learned about Neovim as much as I have learned about Nix by maintaining nvf. The
most important discovery while working on nvf and Neovim, was that **Neovim is a
subpar editor**. I mean this in an endearing way of course, I would want my
editor to become better and I think it is moving in the right direction,
however, with contenders such as Helix now challenging Neovim's place it _might_
be the time to reconsider priorities and re-allocate resources. Although I am
uninterested in Helix [^1], it has pushed--moreso, nudged Neovim in the correct
direction by looking at Neovim's long-time mistakes and working on fixing them.
For one, Helix boasts a more consistent interface for features that are only
available as plugins on Neovim. There is no conflicting design choices or UI
decisions. Not yet, anyway. I think consistent UI is a good thing to have in
your editor, however good your UX may be.

[^1]: This is due to my particular distaste of Lisp and Lisp-likes. Helix' so
    called "plugin system" is, at its core, a glorified Scheme interpreter and I
    do not feel positively about it. I believe there is also talks about using
    Scheme for _configuration_, and not just plugins. Compared to something like
    TOML, Scheme is a horrible choice and frankly that alone makes me want to
    distance myself from Helix. This is not to say Helix is a bad editor, I
    quite like the concepts it introduced to the editor scene but it does not
    strike me as something I can bring myself to daily drive.

As I have mentioned above, Neovim has started moving in the correct direction
with some of the core-features of Helix stealing the hearts of many Neovim
users. After a very underwhelming 0.10 release, I believe 0.11 is taking Neovim
in a better direction by analyzing the core demands of the community and trying
to implement them as a part of the editor, in response to the needs and demands.
The new LSP interface appears very interesting, though I would be equally happy
to see a consistent interface for linters and formatters. null-ls (now none-ls)
has been a frustrating experience, with how slow and clunky it is. none-ls
doubled down on complexity by moving feature-complete builtins to a different
repo, which you have to fetch and load yourself. This is _not_ how an editor
should function. Taking from Helix, I would be delighted to see some of the
plugin exclusive features as parts of the core editor. Although, this might be
wishful thinking. So far, I am excited for the prospect of natively configuring
LSPs and a few UI additions that I have been looking forward to. Perhaps I'll
write about Neovim again when 0.11 drops. There is also the less commonly talked
about [snippet engine](https://github.com/neovim/neovim/pull/27339) that will be
built into Neovim with 0.11. Those are all very welcome additions, and it is a
great time to be a Neovim user.

For the time being, I have been aggressively dropping plugins that I don't
_really_ need or rewriting them myself as more efficient autocommands as parts
of my configuration. This seems to have helped with the startup times, as some
Neovim plugins are _very_ inefficient. I have also dropped nvim-cmp because how
how slow it was, but blink.nvim is restoring my "faith" in completion plugins
again. The [frizbee](https://github.com/Saghen/frizbee) matcher is quite fast,
and hopefully it will be utilized better in the future. On that note, I
encourage you to do the same. Learning Lua is trivial, and if you have
experience with programming you might be able to find far smarter
implementations to problems "solved" by small convenience plugins.

## On Things

[nvf]: https://github.com/notashelf/nvf
[Schizofox]: https://github.com/schizofox/schizofox
[Hjem]: https://github.com/feel-co/hjem
[Microfetch]: https://github.com/notashelf/microfetch

On a more emotional side, I have been very burnt out with things. If you use any
of my projects, you might have noticed that they have not been maintained on
their usual pace for a while now. This is not permanent, I have _many_ plans but
unfortunately not enough time to follow through _for now_. Expect the language
modules to be improved for [nvf] in the near future, and an internal rewrite of
[Schizofox]. [Hjem] is, fortunately, a team project and is able to proceed with
and without me. I consider other public software (such as [Microfetch]) I've
created to be stable, but perhaps they will be picked back up as well. I have
been meaning to make Microfetch even faster (can't stop won't stop) for a while
now...

Regardless, there are a nice things in the future but I first need some free
time. Working on a few projects, and it is almost the busy season at $WORK. But
I digress. Wanted to give you this as a progress report, and to explain the
reasoning behind my absence. Some of those projects have been getting a lot of
attention, even with my absence, so I wanted to personally thank everyone who
has been submitting pull requests. You may not think much of it, but it means
much to me that you have taken the time to contribute to the project(s).

## Closing Thoughts

If this reads off as a little pessimistic, worry not. Nothing is changing
anytime soon, or at least nothing is changing for the _worse_ anytime soon. I
will continue writing on this blog, and I will continue working on nvf as Neovim
appears to be my forever editor. This was a temporary break from my usual pace
of detailed, technical writing that takes more time and an opportunity to get
some things off my chest, or out of my mind. As I've said before, there are
multiple articles in the writing, but I would like to hear what you think I
should write about too. Nix ecosystem is weirdly obscure, and sometimes
independent blog articles do better than official documentation for learning.

If you have read this far, thank you. I would also like to hear your thoughts on
an of the things I've talked about above. Feel free to reach out to me anytime.
That said, this is all I have time for today. Thank you for reading.
