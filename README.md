# notashelf.dev

My personal website, after countless hours spent revising and even more
rewriting. This is iteration number 8, I think. Ask me if I care.

## Stack

Built with Astro and Typescript, after several NextJS setups, a Pandoc setup and
a crossover with my pure-HTML personal webpage. This site leverages Astro to
bring together my personal website and my blog collection as a single site that
is built with Astro.

I think it's still pretty lightweight, but I've gone a bit more overboard this
time around because of _how easy_ Astro made it to overengineer things. Using
Pandoc, Bash and Makefiles was a great experiment, but this is much better to
work with.

### Features

Main reasons I've chosen Astro

- Produces a static website
- Accessible and responsive
- Optimized images
- Cheap, full page transitions
- Javascript (mostly) optional

## Building

The defaut devshell provides everything you need to build the site; `nodejs` and
`pnpm`. Use Direnv for your own sanity, and run `pnpm run build` to produce a
static site. You may serve it locally with `pnpm run dev`, or via Nginx using
the production build.

Alternatively there is a Nix package provided as `build-site`, which can be
built with `nix build .#build-site`.

### Using

Ha.

## License

Available under the [CC BY License](LICENSE). Please do not modify or
redistribute post contents without my express permission.

[^1]: Make sure you always read bash scripts you see on the internet before
    actually running them.
