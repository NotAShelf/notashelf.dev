---
title: My New Website
description: Explaining the stack and history of this site... using this site.
date: 2025-08-16
keywords: ["software", "programming"]
---

I have a confession to make.

My first language, and probably the one I've spent the most time with, is...
Javascript. Devious, I know. Given that, it won't shock anyone to hear I've
spent most of my career steeped in frontend work before eventually pivoting to
full-stack after discovering Linux. I'm well versed in (though not always deeply
knowledgeable about) a handful of web stacks, nearly all of which I've tried and
failed to use for my personal site.

Despite my supposed "expertise" with web tech, it still took me more than five
years to publish a single website that didn't feel like a half-baked experiment.
You could call it laziness, but honestly, I think it comes down to a long,
grating relationship with the endless parade of web frameworks I stumbled
through.

## First Few Steps

At the start, I reached for whatever was trending. I was still in university,
and while I'd mapped out my career path, I figured having "**Proficient in React
& NextJS**" on my CV couldn't hurt if I ever needed to swap over to corporate
life. Maybe I could be the only programmer in a room full of political
scientists. Not a bad backup plan. [^1]

[^1]: It was not a bad decision either. I have used my programming knowledge
    many times during my time in Academia, and not _once_ have I regretted being
    proficient in an obscure arcane talent that people look at with confusion.
    The doors that opened simply because I know how to pull a rabbit out of a
    hat I've made is simply astonishing.

NextJS was _all_ the rage back then. Seriously, everyone talked about how good
NextJS is. Angular was close behind. Vue was new and, to me, unconvincing. The
Vue ecosystem felt weird, and to be blunt, it still doesn't _quite_ grab me. So,
React and NextJS became the foundation for my first attempts. That version of my
site saw at least four rewrites. CSS frameworks came and went; none of them
really clicked. I was pumping out way too much code for something so tiny. Sure,
I could just write vanilla HTML, but come on, that's the boring route. I refused
to go full HTML monk.

Then I found Pandoc. Well, "fell back" to Pandoc, really, after getting
absolutely fed up with NextJS. Every update broke something vital, and for a
static site, that was just not worth the headache. Why juggle a dozen
dependencies when Pandoc could spit out templated HTML from Markdown with no
fuss? Writing the content in Markdown, letting Pandoc convert it, and scripting
the build with Lua---another language I was getting into at the time thanks to
Neovim---felt right.

Suffice to say, it _actually worked_! My blog lived as a pile of Markdown plus
HTML templates for a while. No broken dependencies, no sudden breaking changes,
just Markdown [^2] and a user API that hasn't shifted in years. Lua made
extending Pandoc easy; it's a language that doesn't get in your way, and
Pandoc's extension model is a gift. So why ditch it? Why even look at another
framework?

[^2]: God I love Markdown. If you are unfamiliar wtih Markdwn, then I feel
    compelled to inform you that this entire post (alongside all others) are
    actually written and almost completely stylized in Markdown. You cannot
    imagine how _good_ it is for writing things on a computer. Hell, I could
    probably write my own book on Markdown in Markdown.

## Enter: Astro

[Content Collections]: https://docs.astro.build/en/guides/content-collections
[MDX]: https://mdxjs.com

While Pandoc did its job, I started hearing more and more about Astro and
Sveltekit. The constant nudging from other developers to "rewrite your site
again" was irritating, and at first I stuck with Pandoc just to be stubborn. But
eventually, even I had to admit that Make and Pandoc weren't cutting it anymore.
My very basic blog was taking almost a minute to compile my Markdown pages.
Frankly this was no longer acceptable.

Honestly, the urge to rewrite came less from frustration and more from a burst
of ideas that needed a real frontend. I wanted a cooking site to reference
recipes from my tablet, and an E-book library for friends. This was around when
I was shifting to backend work, but since these were solo projects, I needed a
stack that wouldn't fight me. Astro stood out. I kept hearing about its
simplicity, speed, and how it "just works."

When I actually started the recipe site, Astro felt like the missing piece.
Markdown and [MDX] were first-class citizens, which meant I could write content
the way I wanted. Astro's [Content Collections] made organizing that content
dead simple, and querying those collections was just as easy.

### Why Astro over NextJS?

My overwhelmingly positive experience with those two projects sold me on Astro.
It felt like working with HTML and Javascript, but without the usual baggage.

When it was _finally_ time to rebuild my main site, I wanted a framework that
would not get in my way. Astro puts simplicity, speed, and ease of use front and
center. Most importantly: minimal Javascript by default. For a site that's
mostly about content, that's not only _nice_ but also _crucial_. Dare I say
_glorious_.

Astro's Markdown and MDX integration is the best I've seen. Writing posts or
docs felt natural, like it was built for that purpose. NextJS supports MDX, but
it always feels tacked-on, like an afterthought. Astro treats Markdown as a core
feature, and it shows. It also shows on their documentation, which is great.

Astro is also lightweight. NextJS ties itself to React's runtime, but Astro lets
you bring in React, Vue, Svelte, whatever you want---or none of them. I could
choose the tool that fits, not the one the framework forces. It also uses Vite
under the hood, which has a vast plugin ecosystem. At the time of writing, this
project is able to seamlessly integrate Svelte, AlpineJS **and Rust** into my
site with no overhead whatsoever. It _just works_ in the immortal words of Todd
Howard.

Performance is another big one. Astro's static-first model means very fast
loads, because only the bits of Javascript you actually need get shipped.
NextJS, even when "static," still drags React along for the ride. For a personal
site, that is just a waste of space.

And the developer experience? There's no contest. Astro's API is
straightforward, and its focus on static sites keeps everything clean. NextJS is
fine if you're building something huge... but for smaller sites, it just feels
overbuilt. Maybe if I were building an e-commerce site---No, that would still be
Astro.

### Why Not NextJS or React?

NextJS and React are great for what they do, but not for this. NextJS brings a
ton of overhead: server-side rendering, API routes, a hydration model that slows
down content-heavy pages. That's all power I never needed.

If I ever need React for a sprinkle of interactivity, Astro lets me drop it in.
But I doubt I'll need it often. As a matter of fact, I _have_ added React for,
well, reactivity, but ended up dropping it since Svelte was a simpler, faster
way of doing that. There's also the ecosystem lock-in. NextJS means buying into
React's world. Astro, however, is agnostic. I can pick and choose, no strings
attached.

And then there's maintenance. Keeping NextJS up to date is a pain. Upgrading
from v13 to v14? Pure chaos. Astro's architecture is simpler, the dependency
tree is smaller, and that's less risk for me. I have also observed that the
updates are handled more gracefully.

## Building with Astro: The Experience

Switching to Astro was the first time in a long time that building a site felt
fun again. Its component model didn't force me into a corner. I could focus on
writing, but still use a React or Svelte component if I needed one.

The recipe site proved that. With Content Collections, organizing recipes was a
breeze. Metadata like prep times and ingredients? Easy to define, query, and
type-check. I spent almost no time fussing with data fetching or schema
headaches.

Performance was just as good as promised. Most of my content is static, so
Astro's zero-JS-by-default approach meant pages loaded instantly. The few
interactive bits---a recipe search bar, a "cooking mode"---were easy to handle
with a bit of vanilla Javascript. If I wanted, I could have used React, but I
didn't need to.

Deployment was the final win. Astro spits out static files, so I could host it
anywhere. Best of all, it played perfectly with Nix and PNPM. No weird configs,
no hoops to jump through. Compared to my previous adventures with NextJS or even
Pandoc, it was almost suspiciously smooth.

### Why Not Vue

I _almost_ left Vue out of this post entirely, but I'm dedicating a whole
section to it because the developers deserve a little credit. Vue is a solid
framework, but it has never clicked for me and perhaps it didn't click for you
either. This is not just for vague reasons. Vue's ecosystem is fragmented in a
way that causes real friction. Take routing as an example: there are several
router solutions, but the official one (`vue-router`) is still a work in
progress every time there's a major Vue update. Half the time, the docs, the
plugins, and the community answers all reference different versions. If I want
to use state management, I have to pick between Pinia, Vuex v4, or whatever new
thing the community has picked up this month, and none of them are as stable as
Redux (or even Zustand) in React land.

The reactivity system, while innotivative, has always felt like a moving target.
In my limited time with Vue I had to jump from Vue 2's options API to Vue 3's
composition API and it felt more like a paradigm shift than a syntax change.
Those two models also hae to co-exist because not all libraries update at the
same speed. I ran into this firsthand when testing out Vue for a side project:
half the plugins I wanted to use still assumed the old API, so I ended up
writing glue code just to get basic things working. The documentation tries to
bridge the gap, but it left me feeling like I needed to pick a side (old or new)
before I could get anything done.

Astro, by contrast, is refreshingly consistent. The content API, the project
structure, the way you bring in components... It doesn't change every year. I
don't need to read a migration guide every time I want to add a feature. For a
solo project, I need stability more than I need clever reactivity or a trendy
new state manager. You were a nice attempt Vue, but you were not _it_.

## Misadventures with my own SSGs

I want to also tell you about a small misadventure. An experiment, so to speak.
Those of you that know me are no doubt unfazed by this, but of course, I
_thought about_ and began prototyping a static site generator of my own. How
could I refuse? There is a certain appeal to building your own tools, and Go is
a language that allows rapid iteration. This static site generator was used for
a short duration, and lived in my NixOS configuration to render my personal
notes live on GitHub pages for the curious visitors. I _almost_ ended up using
it for this site too, but I am so very glad that I didn't.

Truth be told a static site generator is not rocket science. You can do it at
home as a fun first project and put it on your CV if you'd like. It demonstrates
proficiency in a lot of things, and you end up with a useful project in your
toolbox. Simply read Markdown files from a directory, convert to HTML, slap on a
template, done. With Go libraries like `blackfriday` and `html/template`, it's
all straightforward. I even thought about building a CLI to watch for file
changes and auto-regenerate, but since I was deploying with Github Actions and
Github Pages, that was overkill.

Ultimately the little I have developed this SSG has been a fun side quest, but
it was not the right call for this site. Or for any of my sites. Building and
maintaining a custom tool is a big time sink, especially when frameworks like
Astro already do the job better. If I ever have a really niche use case, or just
want to learn something new, maybe I'll revisit it. There's something special
about owning every piece of your stack, even if it's just for the journey.

Similarly, I skipped over existing SSGs like Hugo or Zola because I wanted total
control over my content. Astro's extensibility lets me work outside the fragile,
soon-to-break component model that plagues a lot of modern frameworks.

## Closing Thoughts

In the end, Astro fit my needs perfectly. I could focus on what mattered: fast,
"beautiful," content-driven pages without the usual mess. This site is proof
that sometimes, picking the right tool really does make all the difference.

### Against Puritanism: Why "Just Use HTML" Is Not Enough

Now for the crème de la crème, a little rant about this breed of developer out
there who loves to toss around links like
[justfuckingusehtml.com](https://justfuckingusehtml.com/) and
[motherfuckingwebsite.com](https://motherfuckingwebsite.com/), waving them
around as gospel for what the web should be. Their message is always the same:
all you need is HTML, maybe a dash of CSS, and anyone who reaches for anything
else is a fool, a poser, or just plain incompetent. They celebrate minimalism
with the zeal of digital monks, scorning complexity, dismissing progress, and
framing any modern tool as an exercise in self-indulgence.

I am, however, tired of this purism bullshit masquerading as wisdom. The web, as
they envision, would be a graveyard of napkins. Static pages that _hurt_ to look
at; with no ambition, no structure, no future. How much time would you spend in
a page that is just words---no color? This kind of radical reductionism isn't
clever. Do you know what it is? Cowardly. It takes nerve to build something that
evolves, that scales, that serves more than a single use case. It's easy to crow
about the glory of raw HTML when all you want is a page with a single paragraph
and no obligation to ever update it. Try running a site that grows, that needs
to adapt, that wants to offer anything more than a digital business card, and
see how far that dogma gets you.

Those who peddle the "just use HTML" dogma love to pretend complexity is always
a choice, a failure of character, some kind of collective delusion. Yet they're
silent the moment you ask them to manage a hundred interlinked pages, keep
layouts consistent, juggle metadata, or introduce even the mildest bit of
interactivity. They'll say "just copy and paste," as if that's a solution and
not a maintenance nightmare waiting to happen. They'll sneer at frameworks, site
generators, or even basic templating. Those are tools forged to solve real
problems, not invented out of boredom. Do you know what sites people don't
really visit? Those that they keep linking like an online Bible of the web cult.

The truth is that the web has changed. That is because _people's needs have
changed_. Static HTML is fine for a manifesto, but it's a dead end for anything
that aspires to be useful, discoverable, or maintainable. The idea that progress
is the enemy is laughable. It's not "bloat" to want content you can update
without breaking your wrists. It's not "overengineering" to want a workflow that
doesn't collapse the moment your ambitions grow or you have a fun idea. There's
nothing virtuous about pretending that the old ways are the only honest ones;
that's just nostalgia dressed up as insight.

Minimalism is easy, and at times I think it's pretentious. Anyone can do
nothing. The real work is in building something that lasts, something that can
change, something that's actually usable for both you and everyone else who
stumbles across it. That means structure, organization, and yes, sometimes
tools—tools that do the heavy lifting so you can focus on what matters. I refuse
to apologize for wanting more than what a text editor and a pile of static files
can offer. The world doesn't need more motherfucking websites; it needs sites
that can grow, adapt, and actually serve their users. You can have a functional
site in under 1MB, don't let anyone convince you otherwise.

So no, I won't "just use HTML." I've seen what that gets you, and I want more.
If that bothers the purists, good. The web was never meant to stand still, and
neither am I.

_P.S. you can write Assembly for the web now. This website does it, it's fun.
WASM is fun._
