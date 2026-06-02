---
title: "My New Tech Stack"
description: "From Javascript, to Golang and Rust: A Technical Journey"
date: 2025-04-03
keywords: ["software", "programming"]
---

I have began programming with Javascript back in 2018. It was a spontaneous
decision, made mostly in the hope of solving a basic problem that a game server
that I moderated was facing. Long story short, I learned Javascript (or at
least, some Javascript) over night and that was it for a while.

That somehow propelled me head-first into web development. I was young, I wanted
a personal website and maybe I could even make a few bucks on the side from
developing websites for people. Since I knew Javascript somewhat decently, I
began looking at HTML and CSS, read some web blogs and a few programming books
that describe the basics of web development and went on with my journey.

Alongside other experiences, this lead me to use Linux as my main operating
system and one of the most important reasons why I chose Linux was because it
was a liberating, customizable experience. As I moved to use tiling window
managers (i3 at the time), I also began experimenting with writing my own
desktop utilities. Learn Python, Go, C, little bit of C++ and eventually Rust;
which is now most of my stack.

While my programming journey has taken a winding road through multiple
languages, each offering a unique set of strengths and trade-offs. Recently, I
made the decision to transition from Golang to Rust while still retaining C in
my toolbox. This post details the technical reasoning behind this move, the
advantages of each language, and why, despite its venerable status, C's build
tooling still leaves much to be desired.

## The Golang Chapter

Go was... a compelling choice to say the least. Be it for its simplicity,
powerful concurrency model and rapid compilation times (which I miss to this day
in Rust.) Its robust standard library and clean syntax allowed me to build
distributed systems with ease. However, as projects grew in complexity, several
limitations became apparent.

One very large issue was memory management. I want my software to be _lean and
mean_ but Go's garbage collection was imposing unpredictable latencies---an
issue in performance-sensitive applications that are the backbone of my home
network. For example, in a real-time data processing application, garbage
collection pauses caused noticeable delays. Benchmarks like `goperf` have shown
that garbage collection pauses can sometimes exceed acceptable limits, making Go
much less suitable for low-latency requirements. The type system is also,
despite its simplicity, a hit-or-miss and it can can feel limiting when dealing
with more intricate, low-level abstractions or when requiring fine-grained
control over data. Lastly, the overhead introduced by some of Go's abstractions
are a bottleneck that I've grown a distaste for during my time using Nix.

These aspects led me to explore alternatives that offer more control without
sacrificing safety or performance.

## Why Rust?

I didn't switch to Rust because of hype. If anything, the constant evangelism
around "memory safety" as if it's the only thing that matters was a turnoff. But
Rust kept solving real problems I hit when working in Go and C, to the point
where using anything else felt like unnecessary friction. It emerged as a
_natural next step_. It is widely used, and even more widely shilled. While I
was using Go, I had experimented with Rust several times but extremely long
build times---alongside the complex type system---drove me off each time.
Eventually I accepted those as a cost for correctness, and began migrating to
Rust. Although, it was a slow process. The Rust book was extremely unhelpful,
especially in the pacing department, but eventually and through the help of many
web searches I accepted Rust. It brings several improvements that address the
limitations I experienced with Golang, which I would like to go over.

### 1. Memory Safety without Performance Penalties

First advantage I'm quite fond of is Rust's **memory safety without the need for
a garbage collector**. Rust's ownership model ensures memory safety at compile
time without relying on a garbage collector. This allows for predictable
performance, a very crucial factor that affected my decision. The borrow
checker, while initially imposing a learning curve, provides a safety net that
prevents data races and dangling pointers. Unlike Go, where garbage collection
kicks in unpredictably, Rust's compile-time borrow checker also ensures that
memory is allocated and freed at the right time. Unlike C, which is another
language I enjoy writing, but not so much \*using, it doesn't require explicit
`malloc`/`free` calls or reference counting in most cases, meaning it balances
control and automation far better than either language.

Instead of garbage collection, Rust relies on **RAII** (Resource Acquisition Is
Initialization), where memory is freed as soon as it goes out of scope.
Consequently the borrow checker ensures safe aliasing of memory, use-after-free
bugs, and iterator invalidation. Nice. I want to control my memory, without
having to micromanange it.

### 2. _True_ Zero-Cost Abstractions

Golang's philosophy is "simple is better." The problem is that simplicity in Go
often means "dumbed down." No proper generics (until recently), no inlining
across package boundaries, and everything is done through interfaces that
introduce runtime overhead. As such, a common issue I had with Go is that
writing high-level, ergonomic code often meant sacrificing performance.
Interfaces, reflection, and even some seemingly simple abstractions introduce
overhead that isn't always obvious (or sometimes not even available because... I
don't know.) Rust does _not_ have this problem because of its zero-cost
abstraction principle: abstractions should compile down to the most efficient
possible machine code.

For example, iterators in Rust provide the same expressiveness as Go's slices
but compile into raw loops without runtime overhead. Generics in Rust are fully
monomorphized at compile time, meaning there's no boxing or interface dispatch
cost. This means Rust allows writing expressive, high-level code while
maintaining (mostly) C-level performance. I have learned recently that Rust
compiles down to efficient machine code thanks to **monomorphization** (try
saying that out loud 3 times in a row)---a process where generics are fully
expanded at compile time, allowing optimizations that eliminate runtime dispatch
overhead. Combined with LLVM's optimizations, Rust often generates assembly that
is as fast as, or faster than, handwritten C.

### 3. Concurrency Without Race Conditions

Goroutines and channels are nice, but they don't prevent data races. In Go, you
still need to rely on locks, atomics, etc, and most importantly careful design
to avoid issues like race conditions or deadlocks. Rust enforces safety at the
type level. This means that Rust code, once compiled, has _mathematically
guaranteed_ thread safety. No surprises, no debugging obscure race conditions in
production. The `Send` and `Sync` traits act as static checks that prevent
unsafe sharing of resources, something that Go's runtime cannot enforce. Rust's
async ecosystem, using `async`/`await` and tools like Tokio, allows for
excellent asynchronous programming without the pitfalls of traditional
thread-based concurrency models.

### 4. Tooling That Actually Works

C's build tooling is archaic, Go's module system is still a mess (`GOPATH` was
awful, and modules are only marginally better), but Rust? Cargo just works.
Dependencies, versioning, cross-compilation---it's all built-in, and I don't
have to waste time wrestling with third-party package managers or Makefiles.
Plus, tools like clippy, rustfmt, and cargo bench integrate seamlessly. Cargo
workspaces make it easy to manage multi-crate projects, allowing for better
organization and dependency management. Honestly, it's impeccable overall.

## Considering Zig

One thing worth nothing about C is that I _enjoy_ writing it. The design of the
language, unlike C++, is simple and it's _fun_ to write. I find Rust fun too,
but sometimes type errors get on my nerves because I appear to get caught by the
most basic ones that I _probably_ wouldn't encounter on C. And while Rust has
largely taken over my system-level programming needs, I have been keeping an eye
on Zig. Zig's simplicity, lack of hidden control flow, and compile-time
execution capabilities make it an interesting alternative to both C and Rust in
certain contexts. Though I find it still a bit immature to really "switch" to as
my primary language. For now Rust will do, but I still feel compelled to mention
what Zig does well.

Some of Zig's strengths include:

- **Manual memory management without footguns** – Unlike C, Zig provides safer
  manual memory management patterns.
- **Better C interoperability than Rust** – While Rust has `bindgen` and
  `cbindgen`, Zig is designed from the ground up to interface smoothly with C
  code.
- **No hidden control flow** – No automatic panics, exceptions, or surprises in
  the compiled output.

I'm not replacing Rust with Zig anytime soon, but for cases where Rust's safety
mechanisms feel like overkill, or where I need tighter control over binary size
and startup time, Zig looks promising. It's too early to say if it'll take a
permanent place in my workflow, but I am keeping an eye on it.

## Why C Still Has a Place

Despite moving to Rust, C continues to hold a vital place in my workflow. Its
low-level access and direct mapping to hardware make it indispensable for
performance-critical tasks, interfacing with legacy systems, or working on
projects where every cycle counts. However, there are areas where C leaves a lot
to be desired.

- Build Systems Are a Mess – Make, CMake, Autotools—none of them are great, and
  package management is nonexistent.
- Undefined Behavior Everywhere – The sheer number of ways you can shoot
  yourself in the foot in C is staggering. Buffer overflows, use-after-free,
  integer overflows—Rust eliminates these entirely.
- Lack of Modern Language Features – No generics, no proper modules, and macros
  are still the hacky preprocessor-based mess they have always been.

That said, C isn't going anywhere. There's too much legacy code, too many
embedded systems, and too many low-level performance demands for it to
disappear. If you want to write kernels, firmware, or low-level graphics code,
you still want C, though you don't necessarily _need_ it. I find Rust's
bootstrappability to be a drawback, but that's for another post.

## Go Has Replaced Python for Web and Scripting

For quick scripting, Go has taken over Python's role in my workflow, especially
for anything web-related. Python's performance is atrocious, and while Flask is
easy to use, it crumbles under load. Go, on the other hand, compiles to a single
binary, has a solid HTTP stack, and doesn't require setting up a virtual
environment just to run a script. The `net/http` package provides a robust and
easy-to-use HTTP server and client, while frameworks like `gorilla/mux` offer
more advanced routing capabilities.

That's not to say Go is perfect---its standard library is missing some utilities
that Python has had forever---but for quick-and-dirty web tools, it's become my
go-to and I'll take Go over Python any day. Though the bar is low, and Go is
barely doing anything to remain above it.

## Final Thoughts

Transitioning to Rust did not mean discarding Golang or C entirely. Each
language serves its purpose:

- **Rust** now leads my efforts in building safe, efficient, and modern systems.
- **C** continues to be my go-to for low-level programming tasks, where control
  over hardware is paramount, despite its antiquated tooling. I usually try to
  work in single files and avoid libraries when I'm working with C, which is a
  good learning experience on how to build stuff but still annoying.
- **Golang** still finds its place in projects where rapid development and
  simplicity are necessary, though its limitations have driven my current focus
  away.
- **Zig** is an emerging contender that I may use for certain low-level
  applications where Rust or C might otherwise be considered.

Long thing short, Rust isn't for everything, and neither is Go or C. Each
language has its niche, and the trick is knowing when to use what. Rust replaced
Go for me in performance-sensitive areas, but I still keep Go around for web
scripts and C for low-level work. Zig? Maybe it'll earn a place too. Time will
tell.
