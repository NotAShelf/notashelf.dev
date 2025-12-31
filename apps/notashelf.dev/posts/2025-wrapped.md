---
title: "2025 Wrapped & 2026 Wishlist"
description: "Projects shipped, things learned, and what I want less of in 2026"
date: 2025-12-31
keywords: []
---

Howdy, it seems creating something with "wrapped" in the name is a ritual this
year around so I decided to name my 2025 recap this way...

Another year almost in the books. I thought about skipping the recap thing
because honestly who cares, but then I remembered I care (a little), and also
the blog has been quiet lately so might as well fill the void with some
self-indulgent yapping before my time runs out. If you are surprised by me
posting at the last second (i.e., after it became 2026 for some people reading
this), I am honestly impressed. I thought myself more predictable and you...
less gullible. That said, I am sufficiently intoxicated for the New Year
celebrations and jokes aside my dear reader, 2025 has been a very long year and
a lot has happened. Hope you've got a drink or some snacks ready, because this
is a long one.

Starting strong, NixOS 25.05 happened and I took part as a release editor. This
coincided with a lot of important real-life events so I could not do as much as
I hoped to but it was a good release regardless, and I'm proud of however much I
was able to contribute. You can thank me for most of the grammar or typo fixes
in the changelog. In the end it was the usual mix of module arguments,
inconsistent defaults, and people discovering that `lib.mkForce` is both
powerful and a crime scene. We shipped without total catastrophe, nobody died. I
count that as a win.

Hyprland is also coming along nicely, for those interested. I'm a little over
Hyprland at this point, but it appears that wlroots -> Aquamarine migration is
continuing its slow, painful crawl toward something resembling sanity. While I'm
still the resident babysitter for the community, I took off from the Nix side of
thing as those are usually not deferred to me. We've got some Nix-related
changes coming along, but there is some time until those are actually...
tangible. Long story short, the ecosystem is still alive. That's more than most
Wayland compositors can say after three years.

## Project News

[written about this]: https://notashelf.dev/posts/my-new-stack
[nh]: https://github.com/nix-community/nh
[nvf]: https://github.com/notashelf/nvf
[ndg]: https://github.com/feel-co/ndg
[feel-co]: https://github.com/feel-co
[hjem]: https://github.com/feel-co/hjem

Projects-wise, it was a year of small-to-medium itches scratched in various
languages. I think 2025 is the year I can finally call Rust my "go-to" language,
and the year my honeymoon period with Go has ended. I've [written about this]
and I intend to talk a bit more in depth about the Go language because of how
confused people seem by my stance but I am quite happy with my adoption of Rust
for the time being. Plenty of new Rust projects now plague my "portfolio."

Something worth noting is that I have taken over [nh] from my good friend
ViperML (who considers the project complete and is no longer interested in
maintaining it as per his original vision) to continue its maintenance as time
goes on. I was a contributor to nh before this happened, so I am quite familiar
with the codebase already. This gradual change in maintainers has covered the
4.0, 4.1 and 4.2 releases as I continue to publish more bugfixes and feature
additions. If you are not familiar with nh, I recommend that you check it out as
it is quite a handy CLI for managing NixOS systems. It will continue to improve
over the time as new updates come along :)

We have also released v0.8 for [nvf]! It was a long time coming and was doubted
by many, but after just over a year, the release is out. This update brings the
Nix-for-Neovim approach of nvf to a whole new level with more robust LSP
configurations, many plugin additions, new documentation and more! The reason
that it took this long, of course, is that I was on a _tiny_ sidequest writing a
documentation generator for my Nix projects! You may or may not be aware that I
have a lot of ongoing projects related to Nix, and documentation is most often a
very high priority. Unfortunately I find the ecosystem _very_ lacking, and I
just had to create something of my own. The first half of 2025 was mostly spent
working on [ndg], our in-house documentation generator at [feel-co]. While this
lives in feel-co and has been designed for feel-co (and my own) projects, it is
a project for _any_ Nix module system looking to document its options in a
stylish manner. Try it, it grew on me despite the hellish CSS and Javascript
misadventures.

Another noteworthy project, which ndg was actually designed _for_, is [Hjem].
I've been bothered by Home Manager's poor file management primitives for a long
while, and all this rage ultimately bubbled up into our own in-house module
system for managing one's `$HOME`, elegantly. Powered by SMFH, a manifest based
file linker made by my good bald friend Gerg-L and designed for atomicity &
correctness, Hjem has received many new features such as brand new
documentation, much better module interfaces, and Darwin support---which many
were excited for. It has come a very long way over the past year, and I am happy
to report that it is nearing "completion." Of course, it's doubtful we'll stop
tinkering on it _ever_ but the features originally envisioned are almost fully
implemented. If you are interested in fast, low-cost and correct file linking in
your `$HOME` perhaps give it a try. It is at a stage where feedback and
bugreports are very valuable to us. We eventually hope to upstream Hjem into
Nixpkgs as a first-party home management system, as it is just the right amount
of abstraction; almost none. Contributions are also welcome, as they are to any
other project of mine!

[MicrOS]: https://github.com/snugnug/micros
[stash]: https://github.com/notashelf/stash
[nix-bindings]: https://github.com/notashelf/nix-bindings
[Microfetch]: https://github.com/notashelf/microfetch
[forked tuigreet]: https://github.com/notashelf/tuigreet

Some other projects worth mentioning are:

- [MicrOS] got its initial push in January --- Nixpkgs modules + runit instead
  of Systemd. It's still extremely niche, still requires manual prayers to boot
  on real hardware, still mine. This is a long-term project that I am hoping to
  develop more in 2026. If you are one of those nutjobs that are against
  Systemd, your feedback would be appreciated.
- The byproduct of a most unfortunate naming conflict, [Stash] has gotten a bit
  of attention around August and has taken its forever place in my Wayland
  desktop as a feature-rich clipboard "manager" with persistent history and
  multimedia support.
- [nix-bindings] has appeared after my poor attempts to deal with C++, and is
  now a somewhat viable way of interacting with Nix's C API. I don't have a
  worthwhile use for this project yet, but perhaps you do. Either way, your
  feedback would be appreciated. It seems that Nix is ramping up the work being
  done for the C API, and as such the bindings will only evolve further over
  time. Perhaps those bindings will make their way into more projects of mine to
  replace instances where I shell out to Nix.
- I have finally [forked tuigreet] to solve many of the minor issues that were
  bothering me. This ended up with me implementing some requested features,
  modernizing the codebase over a single week, and adding a new configuration
  system. Since tuigreet is my primary greeter and will remain as such for the
  foreseeable future, I plan to maintain it as much as I can. If you _also_ use
  tuigreet and have had feature requests or bugs to report, then head over to
  the issue tracker and let me know. I promise to keep an open mind. PRs are
  also very welcome as you might guess. Ratatouille is an infinitely powerful
  TUI framework and I plan to leverage its powers further as time goes by. The
  result? Terribly extensible TUI greeter. You're welcome.
- [Microfetch] has gotten _much_ faster and has taught me a lot about Rust. It
  has also seen a bit of attention late 2025, so perhaps it is now adopted by
  more NixOS users. It will, of course, continue to get faster. Sky is the
  limit. In both speed and pointlessness.

[watt]: https://github.com/notashelf/watt
[tailray]: https://github.com/notashelf/tailray
[flint]: https://github.com/notashelf/flint
[tempus]: https://github.com/notashelf/tempus

Other than that, I've continued housekeeping work on [watt] (CPU power
management), [tailray] (Tailscale systray in Rust), and a dozen smaller things
like [flint] (flake input linter), and [tempus]. Nothing revolutionary, but they
ship, people use them, and my system feels marginally less awful.

## Blog Updates

My blog has remained opinionated and chaotic as it was designed to be. I think
I've dropped plenty of posts within 2025, but I'd like to highlight a few that
I'm particularly proud of.

Blog stayed opinionated, as always. Dropped a few longer pieces that I'm still
mildly proud of:

- "_The Curse of Knowing How, or; Fixing Everything_" was my most popular post
  this year, and it opened the door to many interesting conversations about
  software and the compelling urge to "fix" things. I'm told this is also called
  "obsession." No, not like the perfume.
- "_The Federation Fallacy_" in June---my thoughts on federated software as I
  have come to adopt them in 2025. Federation is cool until you realize most
  people just want their little walled garden with extra steps.
- "_I am Not Convinced by Vibe Coding_" in August---I'm quite disappointed in
  the state of... well, everything. Software is only one of the things AI has
  managed to ruin (I reckon with many more to come) but imagine how beautiful it
  would be if we just stopped telling glorified autocomplete to rewrite things?
- "_The Tradeoff Trap_" shortly after---simplicity isn't a virtue if you're just
  sweeping edge cases under the rug and calling it minimalist.

Shorter rants and post have made their appearances, but I am not going to ruin
the fun of discovering those posts for yourself, organically. I also plan to
make a few more posts in early 2026 as I get to finishing them, so maybe also
stay tuned? I've got an [RSS feed](https://notashelf.dev/rss.xml) that you can
subscribe to if what I write interests you :)

Shorter rants sprinkled in about Golang deliberately dodging good patterns,
mutation testing as the only test metric that matters, why Hydra is ironic hell
for a declarative ecosystem, and the usual Nix-sucks-but-less-than-alternatives
sermon.

## Other Stuff

I think I aged like ten years over the last year. A lot of things happened, but
most prominently, _burnout happened_. Still ongoing work on privacy/data
integrity in policy contexts. Briefly relapsed to Arch in November---don't ask,
it was bad, I'm back on NixOS, lesson learned (again).

Sailing, as usual, was alright when weather allowed. It seems that I am making
less time for things I actually enjoy. Chess elo still trapped in the 1100-1150
limbo but I haven't played chess in almost six months. I guess you can't climb
in ELO without, you know, actually playing the damn game.

Overall? Just the slow realization that software culture is still mostly vibes,
politics, and bloat, and we're all just trying to carve out tiny corners where
it sucks marginally less.

## 2026 Wishlist: bigger than projects, smaller than miracles

This brings us to my 2026 wishlist, and I'm tired of small asks. Polish is nice,
but polish on a rotting foundation is just expensive lipstick.

What I _actually_ want this year is an industry (and our little corners of it)
that _starts punishing redundant complexity_. Not rewarding it with stars,
funding or useless engineer titles but instead make adding a dependency cost
something real---social cost, maintenance cost or cognitive cost. Stop
pretending that "but it's modern!" is an argument. We are in the year of 2025
and for some godforsaken reason our computer resources seem like they will be
dwindling over time. Do you know what this means? OPTIMIZATION god damn you,
actually think about it for once. I am tired of useless Typescript projects for
desktop or Python in production. Write actual languages. Write Rust, write C,
write C++ but stop overcomplicating. On this note, tooling that does not
actually hate maintainers would not be so bad either. NixOS modules cleaner from
the start. A CI that isn't as ugly as the nightmare that is Hydra. Less YAML
worship. Less vibe "coding" in infra that people rely on daily.

Minimalism that isn't performative or cultish. Suckless is an unfunny joke sure,
but it is not and has never been the endgame. We need small _and_ correct, small
_and_ usable, small _and_ secure. Not just "fits in my head" while leaking like
a sieve. We know this is possible, because people used to do it when it was
funny. Now it's important, and people have long forgotten.

I also want privacy to stop being a quirky nerd interest. This is not a niche
hobby for people who like encryption diagrams. This is something normal adults
should understand well enough to get angry about. Educate your wine aunt.
Educate your siblings. Explain it in plain language until it clicks that
"exceptional access" is just marketing speak for "someone else gets to read your
shit". No more ChatControl style proposals quietly sliding through because
someone mumbled "_but cyberbullying uwu_" and everyone nodded along to avoid
looking callous. That rhetorical trick needs to stop working. I need widespread
acceptance of a very boring technical truth: every backdoor is just an exploit
wearing a badge. There is no such thing as a friendly vulnerability, no such
thing as access that only the good guys use, no such thing as a hole that stays
politely scoped to its original intent. If a system can be accessed, it will be
accessed, by actors you did not anticipate and in ways you did not authorize.
Governments, companies, and especially mid-tier tech bros need to internalize
this as a fact of reality, not treat it as optional flavor you can trade away
for optics or convenience. You _wish_ this is paranoia, but it isn't. It is
_pattern recognition_ and anyone with more than just a goldfish brain should be
able to notice the patterns as well. There is a rant coming about this, but I
will spare you for today. Or rather, I will spare you _the rest_ for today.

Last but not least, I wish for a single ecosystem somewhere, anywhere, that
still chooses craft over clout. Not as branding, not as a values statement, not
as a thin excuse for moral theater, but as an actual operating principle. No
moral grandstanding, no trend chasing, no resume padding rewrites whose main
purpose is to signal participation in whatever the current discourse cycle
happens to be. Just good engineering _because it is good engineering_. Systems
that are designed to be understood, maintained, and trusted by the people who
have to live with them. We can have this. We have had this. We know exactly what
it looks like when correctness, performance, and restraint are treated as first
class concerns rather than optional polish.

What changed is not that nobody cares anymore. It is that we have become so
fragmented that care is no longer visible. A lot of people still care, quietly,
competently, and without hashtags. They just do not want to spend their limited
time arguing with the loud group of critters who insist that performance can be
bolted on later, that quality is premature optimization, and that
maintainability is someone else's problem. "We shipped and that is all that
matters" has become an excuse to stop thinking, as if shipping were the finish
line rather than the point where responsibility actually begins. That mentality
does not just produce bad software, it produces brittle ecosystems that slowly
train everyone involved to accept decay as normal. If craft does not matter,
nothing downstream does either. That idea needs to die. It needs to die for
_good_.

Okay, I think that's it for my rant. Let's wrap it up for today.

## Closing Thoughts

It has been a long and somewhat productive year. I've created a lot, contributed
to a lot, and cynically criticized a lot. I do not plan to change. I will
continue to create, contribute and criticize.

2025 was survivable.\
2026 will probably be too.\
Software will keep being disappointing.\
We'll keep trying to disappoint it back a little less.

If things get better, thank the people who still care.\
If they get worse... blame webdevs. Always blame webdevs.

I'm looking back with bittersweetness but I cherish a lot of things, and a lot
of... _you_. I've met a many amazing people over 2025 that I am happy to call
"friends" over this parasocial existence that you call the internet. Know that
you are appreciated my dear reader, and see you next year, or; see you when I've
got something worth saying. Have a nice one.

- raf
