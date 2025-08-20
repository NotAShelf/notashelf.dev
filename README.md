<!-- markdownlint-disable no-inline-html -->
<h1 id="header" align="center">
    notashelf.dev
</h1>

## Preface

This is a monorepository containing my website and blog as well as its
dependencies. The rendered site is available under
[notashelf.dev](https://notashelf.dev), and this time it uses Astro as the
underlying build tool, while also exploring the possibilities of components done
in various languages or frameworks. Countless hours were spent rewriting this
site time and time again. This is iteration number 8, I think. Maybe 9, who
knows?

## Repository Structure

As my needs have changed, so did this repository. I have decided to consolidate
packages/utilities created for my website into a single repository. This allows
me to work on everything from a single repository, thanks to PNPM's workspaces
feature. The repository structure is as follows:

```bash
notashelf.dev/
 ├── apps # webapps
 ├── nix # nix packaging
 ├── packages # dependencies, local packages, etc.
 └── scripts # Node scripts involved in the build process
```

The **apps** directory contains, and will continue to contain, web applications
such as my website and blog. If I plan to host more static sites under my
domain, that is also where those new sites will go. The **packages** directory
contains packages, utilities or other home-made dependencies used in the web
applications. This, for now, includes my Vite plugins, Astro integrations and
WASM components. **scripts** directory is bit of a wildcard, because it contains
Node scripts I wrote for fun and comfort, it's probably not good reference.
Lastly, the **nix** directory is for packaging and to keep Nix tooling out of
repository root as much as possible.The top-level `flake.nix` acts as the entry
point for packaging, though `pnpm` is utilized to an extent in the repository,
and can be leveraged for rapid development builds.

Markdown sources of my writings, blog posts, and similar content can be found in
`apps/notashelf.dev/`. Namely, the `posts` directory contains Markdown and MDX
sources for my posts.

Astro components utilized in the final site are defined in
`apps/notashelf.dev/src`, alongside my layouts, stylesheets and so on.
Remark/Vite plugins, Astro integrations and other components will always be
located in the `packages` directory.

### Apps

- [notashelf.dev](https://notashelf.dev) is my personal website and blog. It
  contains some information about me, and about my projects. It also contains my
  technical writings. This site collects anonymized analytics about user traffic
  using [Plausible Analytics](https://plausible.io). This site does not store
  any cookies. NGINX logs for the site are anonymized in a similar fashion to
  protect your privacy.

### Packages

All in-house dependencies created for my personal website have been stored in
the `packages` directory, which is where new dependencies will be added. For the
time being, it contains three distinct packages.

- [astro-email-obfuscation](./packages/astro-email-obfuscation/) is a home-made
  Astro integration with advanced e-mail obfuscation capabilities, designed to
  fend off scrapers to the best of my ability.
- [astro-plausible](./packages/astro-plausible) is an Astro integration,
  refactored out of my previous `notashelf.dev` app where it was a tiny
  component. Now it's a fully tested integration with various customizability
  options.
- [astro-purge-css](./packages/astro-purge-css/) is a small Astro integration
  that purges unused styles using PurgeCSS.
- [remark-em-dash](/packages/remark-em-dash/) is a Remark plugin to replace
  `---` with em dashes. This was not covered by Astro's markdown typography, so
  I just made a plugin.
- [vite-copyright-replace](./packages/vite-copyright-replace) is a Vite plugin
  to replace a placeholder with the current year to keep license notices
  up-to-date without using Javascript to infer it from the browser's clock.
- [wasm-utils](./packages/wasm-utils/) contains my personal WASM utilities that
  are leveraged in [apps/notashelf.dev](./apps/notashelf.dev/) to offload
  compute-heavy operations to smaller, faster WebAssembly modules. This is an
  experiment more than anything, but there _have_ been performance gains.

## Stack

The stack of my website is hopefully finalized. I have chosen to build it this
time around using Astro and Typescript. Astro makes it _really_ easy to
integrate Typescript (and frameworks or libraries!) into our stack, so I will be
avoiding _vanilla_ Javascript as much as possible. The decision to opt into
Astro and this specific stack does hurt portability, a little, but I do not
intend to switch as it seems future-proof enough not to warrant any more
rewrites. Svelte and WASM (built with wasm-pack) have been added to the stack as
experiments, but they provide microscopic performance gains in very specific
circumstances.

### Background

This site has seen several React/NextJS setups, a self-made templated Go
program, a Pandoc based templated Markdown setup and a pure-HTML build that I
have crossed the Pandoc build with. This revision leverages Astro's content
collections and Vite's extensibility to bring together my personal website and
my blog collection as a single site that is built with Astro.

I think it's still pretty lightweight, but I've gone a bit more overboard this
time around because of _how easy_ Astro made it to overengineer things. Using
Pandoc, Bash and Makefiles was a great experiment, but comparatively this is
much better to work with. That said, the user-facing side of the site _is_
lightweight. It loads pretty fast, and it has been optimized to require as
little resources as possible. It's still below 200kb for the initial page. Hwo
cool is that?

### Features

Main reasons I've chosen the stack I did

- **Astro**
  - Produces a static website
  - Accessible and responsive
  - Optimized images
  - Cheap, full page transitions
  - Wide coverage for my use-cases
  - Clientside Javascript (mostly) optional
    - No need to use Lua filters for basic functionality
  - Vite under the hood
    - Incredible plugin ecosystem and integration options
    - Maximum control of the build tooling
- **Svelte**
  - Excellent clientside hydration performance
- **WASM**
  - Fast
  - Fun to work with
  - Allows writing not-web languages for the web [^1]

[^1]: You still have to interface with this somehow, but it can be used to defer
    the most resource intensive or cognitively complex operations to another
    language or framework.

## Contributing

Any kind of contributions are welcome. If you find a problem that you think you
can fix, or just want to improve something (opinionated changes may be rejected,
but performance improvements for example are welcome) then feel free to open a
pull request.

Make your changes, and open a pull request. Please make sure that any TS/Astro
code is formatted with `prettier` before pushing your changes. Markdown must be
formatted with `deno fmt` An alias is provided in the `package.json` to invoke
`prettier`, as `pnpm run fmt`. Additionally it would be nice if you could avoid
tripping the linter, which is very strict. `pnpm run check` lets you view the
linter results directly. Make sure that no new warnings are introduced.

### Building

> [!WARNING]
> This is my personal website, and it has been designed with my needs in mind.
> If you like what you see, I strongly suggest creating your own
> [Astro](https://astro.build) project and create your own website. If you would
> like to discuss how you may do this, please feel free to contact me. I'll try
> to help you out. Below instructions are for **contributors** and you will not
> receive any support in building or modifying this site if you want to run it
> yourself.

The _recommended_ way of hacking at this project is by using
[Nix](https://nixos.org). There is a default dev shell that provides everything
required to work with this project. I also provide an `.envrc` for Direnv
integration, which you would be recommended to use.

If you choose _not_ to use Nix, then you will need to install several
dependencies. Most notably, you will need `nodejs` and `pnpm` installed with
your package manager as a bare minimum. You will also want `cargo`, `gcc`, and
`wasm-pack` to build the website, which requires my
[wasm-utils](./packages/wasm-utils/) to be built.

- There are pnpm scripts exported in the repository root that you can use to
  build things. E.g., `pnpm run build:web` will build the web components.
  Without a specified, you will build everything.

- Use Direnv for your own sanity, and run `pnpm run build:web` to produce a
  static site. You may serve it locally with `pnpm run dev`, or via NGINX using
  the production build.

Alternatively there is a Nix package provided as `site`, which can be built with
`nix build .`. The WASM component is not exposed as its own package, but is
built automatically when building the default package.

#### Testing

While my testing setup is still barebones, I have around 25% coverage with
Vitest. If you are adding new scripts, then some test must accompany those
scripts. For Astro components I do _not_ have tests yet, but they'll eventually
be added. `pnpm run test` is the quickest way to run your test.
`pnpm run test:coverage` can be used to view a coverage report.

## License

<!-- I'm looking at you. You know who you are. -->

> [!NOTE]
> All creative content, which includes all of my blog posts, project data and
> affiliations, are available under the [CC BY-NC License](./LICENSE). By the
> terms of this license, you must provide proper attribution, state changes if
> any and release remixed content under the same legal conditions as this
> repository.

Any Typescript, Javascript, Astro, Svelte, Rust etc. code, my Astro
integrations, Vite plugins other package components of this repository have been
made available under the **Mozilla Public License v2.0**, as
[dictated](./packages/astrp-plausible/LICENSE)
[by](./packages/vite-copyright-replace/LICENSE)
[their](./packages/astro-email-obfuscation/LICENSE)
[respective](./packages/remark-em-dash/LICENSE)
[license](./packages/astro-purge-css/LICENSE)
[files](./packages/wasm-utils/LICENSE).

Please do not modify or redistribute post contents without my express
permission. For any code taken directly (which I know to be happening), an
attribution would be nice out of respect for my efforts.

---

<div align="right">
  <a href="#header">Back to the Top</a>
  <br/>
</div>
