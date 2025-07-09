---
title: My New Website
description: Explaining the stack and history of this site... using this site.
date: 2025-05-17
keywords: ["software", "programming"]
---

# My New Website

One of the first languages I have ever learned was Javascript, so I think it
comes as no surprise that I worked on frontend for a very long time before I
eventually pivoted to full-stack as I was introduced to Linux. I am experienced
in (though not necessarily knowledgable with) several web stacks, most of which
I have tried using to build my own site.

My first few attempts were using those popular web frameworks, such as NextJS or
Vue. I am not a huge fan of Vue's ecosystem, but NextJS and React were quite
high on my preferred tools list at the time.

Eventually I "fell back" to Pandoc. Why should my website use all of those fancy
stacks when Pandoc works flawlessly in creating templated HTML? I could just
write my pages in pure Markdown, and Pandoc would handle conversion for me. That
_did_ work, and my blog lived as a repository of Markdown + HTML templates that
Pandoc would use under the hood for a while. To be honest, that was quite nice.
I didn't have to bother updating any dependencies, I wouldn't have to deal with
large breaking changes as both Pandoc's user API and Markdown spec are long
static. Lua were pretty useful too, as I think Lua is pretty easy to work with
and it introduced a powerful extension ecosystem to Pandoc itself. So why
change, why choose a new framework?

## Enter: Astro

[Content Collections]: https://docs.astro.build/en/guides/content-collections

I have been hearing nice things about Astro for a while now. About its
simplicity, its performance and its ease of use. When I decided to build a web
application to host my vast collection of cooking recipes, Astro came into mind
for its easy integration with Markdown and [MDX](https://mdxjs.com), both of
which are very powerful tools for writing documents. Astro's
[Content Collections] sets of data and content very easy with easy methods of
_querying_ those collections directly using Astro's own API.

### Why Astro over NextJS?

When I decided to rebuild my site, I wanted a framework that prioritized
simplicity, performance, and ease of use. Astro stood out because it focuses on
delivering static content with **minimal JavaScript** (which is quite high
priority on my list of needs) by default. This approach aligns perfectly with my
goals, as my site is primarily content-driven: I am not looking to show off,
just to get things done.

Astro's seamless integration with Markdown and MDX was another major draw.
Writing blog posts and documentation felt natural, and I didn't have to fuss
with complicated configurations. While NextJS also supports MDX, it often feels
like an add-on rather than a core feature. Astro, on the other hand, treats
Markdown as a first-class citizen, which made the process incredibly smooth.

Another reason I chose Astro was its lightweight development model. Unlike
NextJS, which is tightly coupled with React's runtime, Astro allows me to use
components from various frameworks like React, Vue, or Svelte---all of which are
optional. This gave me the flexibility to pick the right tool for the job
without unnecessary overhead.

Performance was also a key factor. Astro's static-first approach ensures that
pages load quickly, as only the essential JavaScript is sent to the browser. In
contrast, NextJS bundles React's runtime even for static content, which can feel
bloated for a simple blog or recipe collection.

Lastly, Astro's developer experience is fantastic. Its intuitive API and focus
on static site generation made it an absolute _joy_ to work with. Unlike NextJS,
which can sometimes feel over-engineered for smaller projects, Astro kept
everything straightforward and efficient.

### Why Not NextJS or React?

As much as I appreciate NextJS and React for what they offer, they didn't quite
fit the needs of this project. For starters, NextJS comes with a lot of
overhead. Its server-side rendering and API routes are powerful features, but
they were unnecessary for my **static** site. React's hydration model also felt
like overkill, as it adds complexity and can slow down load times for
content-heavy pages. Though thanks to Astro's integrations, I can still tap into
React for client-side hydration if I really need to. Though, I doubt I'll need
it anytime soon.

Another issue is the ecosystem lock-in. With NextJS, I would be tied to React's
ecosystem, which didn't offer the flexibility I wanted. Astro's
framework-agnostic approach allowed me to mix and match technologies without
being restricted.

Finally, maintenance was a concern. NextJS projects often involve more
dependencies and a higher risk of breaking changes with updates. Previously I
had worked with NextJS, and updating from v13 to v14 was a total nightmare.
Astro, with its simpler architecture and smaller dependency footprint, felt like
a safer and more sustainable choice in the long run.

## Building with Astro: The Experience

Once I settled on Astro as the framework for this site, the actual
implementation process turned out to be a delightful experience. The first thing
that stood out was how intuitive Astro's component model is. Unlike frameworks
that force you into a specific paradigm, Astro's flexibility let me focus on my
content while still giving me the option to use React or Svelte components when
needed.

For example, one of the "challenges" that I've faced was organizing my
collection of cooking recipes. With Astro's Content Collections, this became
incredibly straightforward. I could structure my recipes as Markdown (or MDX)
files, define a schema for metadata like prep time and ingredients, and query
them using Astro's API with easy type-safety. This approach felt natural and
saved me a significant amount of time that I would have otherwise spent setting
up a more complex data-fetching system that I _could_ employ if I wanted to
overengineer it.

Another aspect I appreciated was how Astro handled performance. Since most of my
site is static content, the zero-JS-by-default approach worked perfectly for me.
Pages loaded fast, and I didn't have to worry about unnecessary JavaScript
slowing things down when all I wanted was to view my recipe. For the few
interactive elements I needed---like a recipe search bar or the 'cooking mode'
component---I could easily integrate lightweight React components without
bloating the entire page, though I ended up handling those with vanilla
Javascript.

Finally, the ease of deployment was the cherry on top. Astro's static output
played nicely with a variety of hosting platforms, but more importantly, it
plays nicely with Nix. Thanks to Astro's static exports and Nix's PNPM hooks, I
didn't need any special configurations to get my site online. Compared to the
hoops I had to jump through with NextJS or even Pandoc in the past, this was a
breath of fresh air.

### Why Not Vue

I was not even going to mention Vue, but I feel like I owe a little bit to the
developers for the solid work that has been going into it. Vue, while a solid
framework, didn't quite _resonate_ with me. Its ecosystem feels fragmented at
times, with multiple competing solutions for common problems, which can lead to
decision fatigue. Though, not that this doesn't apply to React...

Additionally, I have always found Vue's reactivity model a bit unintuitive
compared to React or even Astro's straightforward approach. For this project, I
wanted something that didn't require me to dive too deep into framework-specific
paradigms, and Astro provided that simplicity while Vue was just... there.

## Misadventures with my own SSGs

Besides _real_ ways of writing websites, at one point, I seriously considered
writing my own static site generator. There's something incredibly satisfying
about building a tool tailored exactly to your needs. For this project, I toyed
with the idea of creating a generator in Go, largely because of Go's simplicity,
speed, and excellent support for concurrency as well as the option to use
templated HTML easily.

The core idea behind a static site generator isn't overly complex. You'd
essentially read a directory of Markdown files, parse them into HTML, and apply
a template engine to give them a consistent layout. With Go, libraries like
`blackfriday` for Markdown parsing and `html/template` for templating make this
process quite straightforward. You could even build a simple CLI tool to watch
for changes and regenerate files on the fly. My site was deployed with Github
workflows and on Github pages, so the watcher was unnecessary but conceptually
it is not very difficult.

While writing my own generator would have been a fun learning experience, I
ultimately decided against it for this project. The time investment required to
build and maintain the tool felt unnecessary when mature frameworks (like Astro)
already existed and provided everything I needed. However, if I ever find myself
with a very specific use case or just want to experiment further, I might
revisit that idea. There's something uniquely rewarding about taking full
control of your stack, even if it's just for the sake of learning.

On a similar note, I avoided existing SSGs like Hugo or Zola because I prefer
being in control of my content entirely. Astro has an easily extensible model,
enough for me to work outside of components that are likely to break in the near
future.

---

In the end, Astro was the perfect fit for my needs. It let me focus on what I
cared about most: delivering fast, "beautiful", and content-rich pages without
unnecessary complexity. This site is the result of that decision, and I couldn't
be happier with how it turned out.
