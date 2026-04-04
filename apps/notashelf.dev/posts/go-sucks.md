---
title: "Why I think Go is a Terrible Language"
description: "Rants and Ramblings on this little known language known as Go"
date: "2026-04-26"
keywords: ["thoughts", "programming", "software"]
---

I'll start with a disclaimer that I know will bother some of you. Maybe bother
you _a lot_, or maybe make you laugh: this is not a screed from someone who
doesn't understand Go. You wish it was, and frankly, I wish it was.
Unfortunately for me, I have written Go in the past and I have also shipped Go
to "prod" in the past. In fact, I continue to write Go when I'm too lazy or
tired to care about correctness---for reasons we'll talk about shortly. It is
also worth stating out right that while I am still in the process of converting
to more... sane languages, some of my most critical infrastructure components
have been Go for as long as I can remember. They are still Go, and they still
hold.

This post has started as a Hedgedoc document I uploaded in response to questions
asking me why I think Go is designed by people who understand language design
very well, but refuse to follow established and beloved conventions. I am still
behind this statement and throughout this post you will see exactly why I
believe this. I have read much of the spec and the proposals. I have read, or at
least try to read, the team's stated reasoning & surrounding memos. The blog
posts about why the things are the way they are and the such. Their defenses,
arguments, and more.

What follows is a case. It is _my_ case about why I think Go is a terrible*
language. This is, put most simply, is my attempt at a precise, specific and
deliberately uncharitable document where the language deserves what is coming.
It is about why Go is a failure of a design philosophy dressed up and paraded
around as pragmatism.

It is my pleasure to say that this is not one for beginners who seek
reassurance. This is also not for experts who are extremely comfortable with
their language. My goal is not changing your mind, but making my case out in the
open. This is also not a hate mail towards Go, but a strongly worded opinion
essay. I intend to write something truly wholesome for Rust in the future, and
one truly vile for Zig. For now, let's talk about Go and its design choices.

## Failure by Design

The first thing I want to talk about, and perhaps the lowest hanging fruit that
everyone reaches for is the error handling patterns of Go. This is simply
because it really is that bad. I think the designers fully understood
exceptions, sum types, and structured error propagation. Quite sure they not
only understand those patterns, but also see the individual beauty of it. They
knew about Haskell's `Either`, about ML's type-safe exceptions and Java's
checked exceptions which are _flawed indeed_ but at least attempt correctness.
Instead, Go enforces explicit error returns everywhere, even when the result is
repetitive boilerplate that actively obscures control flow. Here, let me give
you a better idea. A typical Go function doing three fallible operations would
look something like this:

```go
func process(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }

    data, err := io.ReadAll(f)
    if err != nil {
        return err
    }

    result, err := parse(data)
    if err != nil {
        return err
    }

    return store(result)
}
```

The actual logic (open, read, parse and store) is four lines. FOUR. The error
plumbing, however, is _twelve_. The ratio of structural signal noise is, if my
math is correct, 3:1 and this is called explicit. Now compare it to Rust, where
`?` propagates errors with identical semantics but doesn't consume your screen
free estate.

```rust
fn process(path: &str) -> Result<(), Error> {
    let data = fs::read_to_string(path)?;
    let result = parse(&data)?;
    store(result)
}
```

> How many lines is that? _1, 2, 3_... Oh yeah, FOUR.

The crucial difference isn't syntax sugar my dear reader. In Rust,
`Result<T, E>` is a real type. `E` is a real type parameter. You can write
generic combinators over it, `map_err`, `and_then`, `unwrap_or_else`. The error
type is part of the function's contract in the type system, not a convention you
hold in your head.

In Go, `error` is a single-method interface. Any type with `Error() string`
satisfies it, which means there is no structured hierarchy, no enforcement and
absolutely no static knowledge of what errors a function can actually produce.
Somewhere around Go 1.12 or 1.13, the Go team added `errors.Is` and `errors.As`
as a post-hoc attempt to recover structure from this mess. This is simply an
admission of guilt. They rejected typed errors, and then recreated a weaker,
ad-hoc version of the same concept without proper exhaustiveness, without
enforced structure and without syntax support.

`io.EOF` is the clearest and perhaps the best illustration of where the model
collapses. It is a _sentinel value_. A global error variable callers check with
`==`. Entire packages special-case it. In a language where `Error` is a proper
enum, EOF would be just another variant the compiler forces you to handle but in
Go it is a convention held together by documentation and (allegedly) discipline.
It is also occasionally violated in ways that take hours to debug. The team
eventually ran a formal design process. The proposal that followed introduced
things like `check`/`handle`, the `try` builtin, a `?` operator and a bit more.
As you'd expect, all of those were rejected. Eventually, sometime in 2025, the
Go blog has proudly declared that there will be _no further syntax-level
attempts_. Now your boilerplate is intentional, and permanent.

The _even lower_ hanging fruit---so low that you don't even have to lift your
arm--- is `nil`, which is its own disaster. Go has `nil`, and Go has interfaces.
Those two interact in a way that is genuinely (and verifiably) broken. An
interface value is internally a two-word structure. That means it consists of a
type pointer, and a data pointer. A `nil` interface means _both are nil_. A
German walks into a bar, end of the joke.

Well not really, but a `nil` pointer to a concrete type type assigned to an
interface variable has a _non-nil_ type pointer and a `nil` data pointer, so the
interface is no `nil`. Confused? Here, let me illustrate. This produces
something like:

```go
type MyError struct{}
func (e *MyError) Error() string { return "oops" }

func getError() error {
    var err *MyError = nil
    return err
}

func main() {
    if err := getError(); err != nil {
        fmt.Println("non-nil error") // this prints
    }
}
```

The function returned no error. The caller receives a _non-nil_ error. Mind you,
this is not even some obscure corner case. It _regularly_ shows up in real,
"production" codebases and the idiomatic fix is someone snarkily telling you
"remember not to do this" enough times so that it never leaves your head how
much you want to punch that person. The _actual_ fix, on the other hand, is
`Option<T>`, which represents absence in the type system rather than relying on
a zero value that _just happens_ to carry type metadata. Rust's `Option<T>`
makes it impossible to use a value that might be absent without explicitly
handling both cases. There is no typed None that looks like Some. The compiler
catches it before your users do.

You'd expect `nil` to be _at least_ coherent given how dominant it is, but no.
`nil` is not even one coherent thing. You can call methods on `nil` pointers if
the method doesn't reference the receiver. A `nil` slice has `len 0`, and **is
safe to range over**. A `nil` map panics on write but not on read. A `nil`
channel blocks forever on receive or send. A closed channel panics on send.

That was a lot of `nil`s in one sentence. Phew. Anywho, the point is that those
are not rules derived from a single principle, but a collection of special cases
to memorize, and getting any one of them wrong produces a runtime panic with no
compile-time indication that anything was wrong. And I think the type system's
failures run _much_ deeper than just `nil`. Go has no sum types, no exhaustive
matching, no non-nullable types, no const generics, no immutability _by
default_. There are basic tools for making illegal states unrepresentable, and
the designers knew this. They then explicitly rejected them in favor of runtime
discipline. As much as I like
[Discipline](https://www.youtube.com/watch?v=wHxOiAz4NF8), that is no substitute
for proper language design.

The absence of sum types is the most damaging. In Rust you typically write:

```rust
enum ParseResult {
    Integer(i64),
    Float(f64),
    Text(String),
    Unknown,
}
```

The compiler forces you to handle every variant. Add a new one later, and every
match expression that _doesn't_ cover it becomes a compile error. In Go you
write an interface, use a type switch, and every unhandled case (silently) falls
through unless you manually add a `default` that panics. This is a convention,
not a guarantee. Nothing in the Go language actually stops you from being unkind
to your future self. Nothing stops you from adding a new implementing type and
never updating the thirty switch statements scattered across your codebase. You,
if ever, find out at runtime. Rust, Haskell, Swift, TypeScript with
discriminated unions---they all surface this as a compile error. Go surfaces it
as a silent no-op, or a wrong result propagating for hours before anyone
notices.

On the same cursed note, non-nullable types don't exist. Every pointer,
interface, slice, map, channel or function can _and will_ be `nil`. You cannot
declare a variable that the compiler guarantees is never nil.

In Kotlin, `String` is non-nullable and `String?` is nullable. This is enforced
at every callsite. In rust, you use `Option<T>` and the match handles the absent
case. In go, however, the best you can do is put a comment saying "THIS
PARAMETER MUST NOT BE `nil`" and hope that someone does not pass it within the
next 3 months, leading the runtime panic. Similarly, immutability is just as
absent: there is no `const` for struct fields, no `readonly`, no way to declare
a value passed to a function must not be mutated. Go has `const` for _primitive
literals_ and that's it. Everything else is just... mutable. The alternative to
immutability guarantees is "just don't mutate things!" is once again convention,
or advice. There is no guarantee, and for a language catering to beginners this
is too heavy of a footgun to hand loaded to the users.

## Let's Talk Generics

The generics situation deserves its own section, and its own _extended_
treatment because it is _such_ a perfect illustration of team's priorities. Go
1.0 shipped sometime in 2012 without generics. Which is fine. Then, for almost a
decade, the team _explicitly_ argued that code duplication is **PERFECTLY FINE**
and was preferable to abstraction, actually. The result was `interface{}` abuse
everywhere, reflection-based helpers, and the unfortunate `go generate`
pipelines that turned code generation into a first-class workflow. The library
itself either duplicated implementations for each concrete type, or punted to
`interface{}` and runtime assertions. If you are a user, you were told to
copy-paste sort functions.

This is supposed to be _pragmatic_, in case you haven't noticed.

I'm definitely not the first person to bash Go over generics, but I still want
to give you its history proper. Generics finally arrived in Go 1.18 sometime in
2022, and they were deliberately constrained. You cannot define a method on a
non-generic type that introduces its own parameters, which rules out a wide
class of useful designs. You cannot write, for example,
`func (r *Repository) FindAll[T Entity]() ([]T, error)`.

Your work around must be either making the entire struct generic, which may be
structurally wrong, or moving to a free function, which discards the method set.
Neither is satisfactory, and Rust has no such restriction. Type inference is
local and frequently fails on anything involving interfaces or composite types,
in cases where any reasonable inference engine would determine the parameters
unambiguously. You cannot access a field through a type parameter even if every
type in the constraint set shares that field. You _must_ define a method
instead, because the type system cannot reason about struct layout through
constraints. There is no specialization: you cannot provide a more efficient
implementation for a specific concrete type. Go 1.25 removed the core type
restriction from type sets, a genuine improvement, but the rest of these
limitations remain.

Structural typing compounds the type system's weaknesses in its own particular
way. Any type with the right method set automatically satisfies an interface,
with no declaration of intent. When a type accidentally satisfies an interface,
it becomes part of an implicit contract its author never intended to make. When
you change a method signature, you may silently break callers who depended on
that accidental relationship, with no error at the definition site; only at the
use site, possibly in a different package. The _canonical_ workaround is:

```go
var _ io.Writer = (*MyWriter)(nil)
```

A compile-time assertion that produces a type error if `*MyWriter` doesn't
implement `io.Writer`.

Think about what that means: the language leaves intent so implicit that
developers invented a hack: _assign a nil pointer to a blank identifier with an
explicit type_. This is just to recover the ability to state intent. That this
hack is idiomatic is more damning than any external criticism. Rust uses
explicit `impl Trait for Type` declarations. The intent is in the code. You
cannot _accidentally_ implement a trait. If you change a trait's definition, the
compiler tells you exactly which `impl` blocks need updating. The contract is in
the source, not inferred from the method set.

## But The Concurrency!

Go's concurrency model is one of its marketed features and perhaps the first to
be mentioned in response when you criticize Go. It is also where the gap between
appearance and reality is widest.

Goroutines are _genuinely_ cheap.

The "share memory by communicating" slogan gestures at CSP and the channels
_may_ look principled, however, as if to really rub salt in the wound the
language provides _none_ of the static guarantees that would make any of it
actually robust. Data races are runtime errors at best: the race detector is
opt-in via `go test -race`, disabled in production by default, and only catches
races that occur in the specific test run you happen to execute.

Not to mention, Go has no ownership model. Any goroutine can read or write any
shared variable at any time. The type system has no concept of thread safety
whatsoever. Rust's type system makes data races impossible by construction:
`Send` and `Sync` are automatically derived marker traits, `Mutex<T>` requires
you to acquire the lock before you can touch `T`, `Arc<T>` requires `T: Send`
before it compiles. Rust doesn't make data races hard to write, it simply makes
them impossible to compile.

Channels in Go do not enforce ownership or linearity. After you send a value on
a channel, you can still use it. Nothing in the language prevents this. You
cannot encode "send exactly once, then close" either and you cannot ensure a
channel is closed by exactly one goroutine. Goroutines have no parent and no
lifecycle tied to any scope. A function can return while the goroutines it
spawned are still running, still holding references to state that should have
been released, possibly blocked forever on a channel that will never receive.
Goroutine leaks are _trivially_ easy to produce. The standard mitigation is
`context.Context`, but passing it is optional and checking the cancellation
signal is optional and nothing enforces either. Kotlin coroutines have lexically
scoped lifetimes built into the runtime. Go has documentation asking you to be
careful.

`sync.Mutex` is not parameterized over the data it protects. You lock it and
then you can access anything. The relationship between a mutex and the state it
guards exists in comments. Rust's `Mutex<T>` wraps the data it protects: the
only way to access `T` is through the guard you get by locking it. The invariant
is in the type. In Go it is in the README.

`defer` is useful and also function-scoped rather than block-scoped, which makes
it wrong for a significant class of resource management problems. Every deferred
call runs when the enclosing function returns, not when the enclosing block
exits. This is fundamentally different from RAII. In C++ and Rust, a destructor
runs when an object goes out of scope---the end of an `if` body, a loop
iteration, an arbitrary block. In Go:

```go
func processItems(items []Item) error {
    for _, item := range items {
        f, err := os.Open(item.Path)
        if err != nil {
            return err
        }
        defer f.Close()
        process(f)
    }
    return nil
}
```

Every file opened in the loop stays open until `processItems` returns. The fix
is extracting the loop body into an immediately-invoked anonymous function, a
workaround that exists because the primitive isn't expressive enough for what
you're doing. Rust's `Drop` triggers at block exit without any special syntax.
The resource is released when the owning variable goes out of scope and that's
the end of it.

## At Least It's Simple!

I think the first and most trivial element of confusion will come from how Go
programs will be _structured_. I find it to be the exact opposite, however, as
Go has little to no coherent "packaging" conventions. This is to say,
package-level variables and `init()` functions add another class of problems.

You see, initialization order within a single file follows declaration order.
Across multiple files in the same package it is not guaranteed. The compiler
_tries_ to resolve the dependency graph but the spec's response to cross-file
ordering subtleties is essentially "don't rely on it." `init()` functions run
automatically, cannot return errors, cannot accept arguments, cannot be called
or tested directly, and can have arbitrary side effects.

To illustrate this issue, I'd like to give you the `database/sql` driver as an
example. You write`import _ "github.com/lib/pq"` and the blank import registers
a database driver as a side effect inside an `init()` call. There is no explicit
initialization, no error return at the callsite, no indication from the import
alone that anything has happened. If registration fails you panic. If you forget
the import you get a runtime error on the first database operation. A language
that claims to value explicitness ships this as the idiomatic database driver
pattern.

This is the first crack in the "simple" story: the language removes visible
machinery, then smuggles the machinery back in as package-level side effects.
The code looks smaller because the initialization path is no longer in the code
you are reading. That is not simplicity. That is hiding the causal chain.

On a similar note, the module system's history is also an embarrassment that the
current state only partially redeems. While a beginners might _not_ be
interested in "hacking" the module system, they might as well be affected by its
side-effects! Go shipped without dependency management. GOPATH had no
versioning;`go get` fetched the latest commit with no lockfile and no way to
specify which version you needed. The community produced Godep, Glide, dep, and
govendor in succession, each incompatible and each dying in turn. Go modules,
required in 1.16, fixed the core problems but introduced new ones. The major
version suffix convention encodes version into the import path itself, so
`github.com/foo/bar/v2` is a different import path from `github.com/foo/bar`.
Updating a direct dependency to a new major version means changing every import
statement in your codebase that references it. No other major language ecosystem
conflates import paths with version identity this way. The `replace` directive
works for local development but does not propagate to consumers, so the
development workflow diverges from the published module and requires manual
management across multiple related modules.

This is not some unrelated ecosystem complaint stapled onto a language rant. It
is the same design instinct again: avoid richer structure in the language and
tooling, then push the resulting complexity into conventions, import paths, side
effects, and developer memory. The beginner may not care about module mechanics
on day one, but the project will care eventually, and then the bill arrives with
interest.

### Tooling

Of course, there's also tools not made by the community. Or, in other words,
let's talk about official tooling.

As anyone who has ever used Go will tell you, and as you might have noticed
throughout the post, Go has a vast first-party tooling. To its credit, I think
the tooling is _good_ in a way that doesn't get enough attention. `gofmt` is
excellent, `go test` being built in is excellent. `go vet` caches a subset of
common mistakes, but the typed-nil-as-interface bug described above is not
caught by `go vet`. Goroutine leak detection is not built in. Correct mutex
usage enforcement is not built in. Those require `staticcheck`, which is
_excellent_ but is third-party and requires explicit CI integration. The
baseline static analysis for a Go project is significantly weaker than the
language's correctness story requires. Build constraints until Go 1.17 were
written as magic comments: `// +build linux amd64` and not as syntax, not as a
first-class feature, as comments the toolchain parses by convention. I am rather
biased here, but this is not what good and reliable design looks like. I draw
the line at doc comments.

This matters because tooling is the usual escape hatch offered in Go's defense.
The language does not encode the invariant, but the tool will catch it. Except
the first-party tools do not catch enough of the failures the language makes
easy. They format the code. They run the tests. They catch some obvious
mistakes. They do not turn Go into a language with non-nullable types,
exhaustive matching, scoped goroutine lifetimes, typed mutex guards, or
structured error variants. The missing guarantees remain missing. The _deeper_
tooling problem is that `reflect` and `unsafe.Pointer` paper over type system
gaps throughout the ecosystem. The standard library's encoding packages use
reflection to serialize arbitrary types at runtime, which means structural
mismatches are runtime errors. Rust's `serde` (which is not in stdlib) does the
same work through procedural macros with full type safety at compile time. The
comparison is straightforward and unflattering.

At this point the boundary between "tooling problem" and "language problem"
stops being meaningful. Reflection, escape analysis output, race detection, and
profiling are not external aids; they are compensatory mechanisms for properties
the language does not or cannot express. Once you rely on them, you are no
longer reasoning about your program purely through its types or its syntax. You
are reasoning about compiler behavior, runtime behavior, and tooling diagnostics
as part of the language. Those are not good cornerstones for a language aiming
to be simple and powerful.

The memory model was tightened in Go 1.19 and is now more precisely specified
than it was. Without an ownership model this doesn't change the practical
situation much though, violations are catchable by the race detector if they
happen to occur during a test run, and production is where you find out
otherwise. Whether a value escapes to the heap is determined by the compiler's
escape analysis, which is a heuristic, not a contract. You cannot declare that a
value must stay on the stack or specify allocation strategy for a type. For most
programs this is an acceptable tradeoff. For latency-sensitive systems it is
not, and the debugging workflow is reading escape analysis output and profiling.
There is no language-level handle on it. Go's GC has improved dramatically and
achieves sub-millisecond pause times in common workloads, but stop-the-world
pauses still occur, and under heavy allocation pressure or with large heaps the
pause behavior becomes less predictable. For trading systems, real-time control,
audio pipelines, anything with hard latency requirements, a GC is disqualifying
regardless of how good it is, because "very short pause" and "no pause" are not
the same thing. Rust has no GC. Stack allocation is the default. Heap allocation
is explicit through `Box<T>`, `Arc<T>`, `Vec<T>`. You know where every
allocation is because, well you know, you put it there.

This is, if anything, where the section should land: Go is simple only if
"simple" means fewer visible concepts on the surface. Once the program has to
explain initialization, dependency identity, static analysis, reflection, unsafe
escape hatches, allocation behavior, and latency, the complexity has not
disappeared. It has merely moved out of the type system and into the runtime,
the toolchain, the build graph, and the operational culture around the codebase.

## Closing Thoughts

None of these problems are isolated. That is the actual point. A production Go
service at scale is functions returning `(value, error)` where `error` is an
opaque interface with several undocumented concrete implementations, callers
checking `errors.Is` against known sentinels and falling through silently on
unanticipated variants, goroutines outliving the requests that spawned them and
holding references to state that should have been released, a mutex somewhere
protecting the wrong data because the association was in a comment that was
accurate when written and hasn't been updated since the refactor, a nil
interface that isn't nil propagating up three layers before producing a panic
the stack trace makes difficult to attribute.

The same pattern repeats in the supposedly simple parts of the language: package
initialization hidden in `init()`, blank imports used for side-effect
registration, module identity encoded into import paths, build constraints once
parsed from comments, reflection used where the type system cannot express the
shape of the program, race detection delegated to an optional runtime tool, and
allocation behavior exposed through compiler diagnostics rather than language
guarantees. These are not separate grievances. They are the same grievance
wearing different costumes.

Every one of these failure modes is preventable in languages that encode the
relevant invariants in their type systems. Every one of them requires discipline
and convention to avoid in Go, and discipline and conventions fail under time
pressure, team growth, and the ordinary entropy of a large codebase.

The defense of Go is that all of this is manageable. With experienced teams,
with good code review, with staticcheck in CI, with the race detector in test
runs and context used consistently, Go codebases can be safe and maintainable.
This is true. The question is why the language demands that entire investment of
infrastructure and discipline to achieve properties that Rust, Haskell, Kotlin,
and Swift provide structurally. Go was designed to solve Google's specific
operational problems: fast compilation, easy onboarding for programmers of
widely varying experience, readable code review at massive scale just to name a
few. And sure, these _are_ real goals, held with clear intent. The original team
understood exactly what they were leaving out. They made deliberate tradeoffs,
consistently applied.

_The problem_, however, is that optimizing for easy onboarding means in this
case (and many others) optimizing against correctness. A language you can learn
in a week is a language that does not make wrong programs hard to write. The
ceiling on what you can prove at compile time is low by design, and as codebases
grow and teams turn over and systems become load-bearing infrastructure, that
low ceiling costs you in ways that are slow, cumulative, and difficult to
attribute directly to the language rather than to the specific code that
happened to fail.

Rust is _by no means_ a perfect language. Compile times are long enough to be a
real workflow problem on large projects. The borrow checker's learning curve is
steep and genuinely so---not artificially steep, because the concepts it
enforces are non-trivial and require building a new mental model before the
errors start making sense. Async Rust is complex in ways that affect real
programs: [^1] the story around `async` in trait methods, `dyn` and
`impl Trait`, and the borrow checker in async contexts is still rough in places.
The ecosystem is younger and has gaps. These are real criticisms and they should
be stated plainly. Rust is harder to learn than Go. That is true and it is not
nothing.

[^1]: Real Rust async has never been tried, actually.

But Rust's design decisions are coherent in a way Go's are not. Sum types are
embraced rather than rejected. Nil is eliminated rather than worked around. Data
races are impossible rather than detectable. Mutex invariants are encoded in
types rather than documented in comments. Async task lifetimes are scoped rather
than floated as untracked background work. The tradeoffs Rust makes push
complexity into the compiler and the learning curve, not into production
incidents. Errors you make in Rust surface at compile time. Errors you make in
Go surface in production. This is not a philosophical preference. The error
handling is the difference between a bug your toolchain catches in two seconds
and a bug that pisses you off for one long afternoon or an entire week.

Similarly, Go is not a badly implemented language either. Well, not too badly
implemented. I would go so far to say that the runtime is excellent and the
standard library is coherent and well-documented. The toolchain is pretty fast
in ways other languages treat as aspirational. These are real achievements and I
think dismissing them would be dishonest. But a language is not just its
runtime. It is the guarantees it gives you, the invariants it lets you express,
the class of bugs it makes structurally impossible. By that measure---the one
that matters most for building software that has to be correct, not just
running---Go is deliberately, knowingly, and permanently underpowered. There's
no escaping it. That was a choice, made by people who understood what they were
choosing and why. It was a clear set of priorities, consistently applied, that
produced a language optimized for a narrow set of operational concerns at the
direct expense of correctness. The gap between what Go lets you build and what
you can actually prove about what you built is not a bug in Go. It is Go.
