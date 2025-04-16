# notashelf.dev

My personal website and blog, this time in Astro after countless hours spent
revising and even more spent rewriting. This is iteration number 8, I think.

## Stack

The "final" iteration of this website is built with Astro and Typescript, with
Javascript on the side for DOM manipulation. This site has seen several NextJS
setups, a Pandoc based templated Markdown setup and a pure-HTML build that I
have crossed the Pandoc build with. This revision leverages Astro's content
collections to bring together my personal website and my blog collection as a
single site that is built with Astro.

I think it's still pretty lightweight, but I've gone a bit more overboard this
time around because of _how easy_ Astro made it to overengineer things. Using
Pandoc, Bash and Makefiles was a great experiment, but comparatively this is
much better to work with.

### Features

Main reasons I've chosen Astro

- Produces a static website
- Accessible and responsive
- Optimized images
- Cheap, full page transitions
- Wide coverage for my use-cases
- Clientside Javascript (mostly) optional
  - No need to use Lua filters for basic functionality

## Building

The default dev shell provides everything you need to build the site; `nodejs`
and `pnpm`. Use Direnv for your own sanity, and run `pnpm run build` to produce
a static site. You may serve it locally with `pnpm run dev`, or via NGINX using
the production build.

Alternatively there is a Nix package provided as `build-site`, which can be
built with `nix build .#build-site`.

### Contributing

Make your changes, and open a pull request. Please make sure that any code is
formatted with `prettier` before pushing your changes. An alias is provided in
the `package.json` to invoke `prettier . --write`, as `pnpm run fmt`.
Additionally it would be nice if you could avoid tripping the linter, which is
very strict.

## License

Available under the [CC BY License](./LICENSE). Please do not modify or
redistribute post contents without my express permission.
