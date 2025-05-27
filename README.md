# notashelf.dev

This is a monorepository containing my website and blog as well as its
dependencies. The rendered site is available under
[notashelf.dev](https://notashelf.dev), and this time it uses Astro as the
underlying build tool, while also explores the possibilities of components done
in various languages or frameworks. Countless hours were spent rewriting this
site time and time again. This is iteration number 8, I think. Maybe 9, who
knows?

## Repository Structure

```bash
.
├── apps
├── nix
└── packages
```

The **apps** directory contains web applications, such as my website.
**packages** directory contains packages required by the web applications, such
as Vite plugins and WASM components. **nix** directory is for packaging and to
keep Nix tooling out of repository root as much as possible.

You can find the markdown sources of my writings in `apps/notashelf.dev/posts`.
If you are planning to contribute to the Astro components, look into
`apps/notashelf.dev/src`. Remark/Vite plugins and other components will always
be located in the `packages` directory.

### Packages

All in-house dependencies created for my personal website have been stored in
the `packages` directory, which is where new dependencies will be added. For the
time being, it contains three distinct packages.

- [astro-email-obfuscation](./packages/astro-email-obfuscation/) is a home-made
  Astro integration with advanced e-mail obfuscation capabilities, designed to
  fend off scrapers to the best of my ability.
- [astro-purge-css](./packages/astro-purge-css/) is a small Astro integration
  that purges unused styles using PurgeCSS.
- [wasm-utils](./packages/wasm-utils/) contains my personal WASM utilities that
  are leveraged in [apps/notashelf.dev](./apps/notashelf.dev/) to offload
  compute-heavy operations to smaller, faster WebAssembly modules. This is an
  experiment more than anything, but there _have_ been performance gains.

## Stack

The (hopefully) final iteration of this website is built with Astro and
Typescript. Astro makes it _really_ easy to integrate Typescript into our stack,
so I will be avoiding vanilla Javascript as much as possible. This does hurt
portability a little, but I do not intend to switch. This also means that DOM
manipulation is done by the Typescript utilities found in the `scripts`
directory of my site. Svelte and WASM (built with wasm-pack) have been added to
the stack as experiments, but they provide microscopic performance gains in very
specific circumstances.

This site has seen several React/NextJS setups, a self-made templated Go
program, a Pandoc based templated Markdown setup and a pure-HTML build that I
have crossed the Pandoc build with. This revision leverages Astro's content
collections and Vite's extensibility to bring together my personal website and
my blog collection as a single site that is built with Astro.

I think it's still pretty lightweight, but I've gone a bit more overboard this
time around because of _how easy_ Astro made it to overengineer things. Using
Pandoc, Bash and Makefiles was a great experiment, but comparatively this is
much better to work with. That said, the user-facing side of the site _is_
lightweight. Loads fast, and does not take a ton of resources just because I
could do that.

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

## Building

The default dev shell provides everything required to build the site. For the
web components, you will need `nodejs` and `pnpm`. For WASM, you will need
`cargo`, `gcc` and `wasm-pack`. There are pnpm scripts exported in the
repository root that you can use to build things. E.g., `pnpm run build:web`
will build the web components. Without a specified, you will build everything.

Use Direnv for your own sanity, and run `pnpm run build:web` to produce a static
site. You may serve it locally with `pnpm run dev`, or via NGINX using the
production build.

Alternatively there is a Nix package provided as `build-site`, which can be
built with `nix build .`. The WASM component is not exposed as its own package.

### Contributing

Any kind of contributions are welcome. If you find a problem that you think you
can fix, or just want to improve something (opinionated changes may be rejected,
but performance improvements for example are welcome) then feel free to open a
pull request.

Make your changes, and open a pull request. Please make sure that any TS/Astro
code is formatted with `prettier` before pushing your changes. Markdown must be
formattedd with `deno fmt` An alias is provided in the `package.json` to invoke
`prettier`, as `pnpm run fmt`. Additionally it would be nice if you could avoid
tripping the linter, which is very strict. `pnpm run check` lets you view the
linter results directly. Make sure that no new warnings are introduced.

## License

Available under the [CC BY License](./LICENSE). Please do not modify or
redistribute post contents without my express permission.
