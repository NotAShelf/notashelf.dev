---
title: "On Mutation Testing"
description: |
  Do You Have A Moment To Talk About Your Codebase's Extended Warranty?
date: 2025-06-06
keywords: ["thoughts", "programming", "software"]
---

If you have ever worked on any serious codebase, then you probably know how
truly deceptive confidence can be; you push a change, tests pass, CI is all
green and the voice in your head yells "**MERGE ON GREEN!**" Then regressions
show up two days later in production. At some point, every experienced developer
comes to the same realization: coverage is not correctness.

That is where mutation testing becomes a quiet revolution. It doesn't just
measure code that's been run, it asks, does your test suite care if this logic
is wrong?

## A Practical Example

Imagine, for a moment, writing a unit test for a function that calculates
discounts. It _passes_, because the discount is 10% and the test expects 10%.
But what if the function always returns 10%, regardless of input? What if you
accidentally hardcoded it and never noticed? [^1] Traditional coverage wouldn't
say a word. It sees the function ran, so it's satisfied. Mutation testing
wouldn't let that slide, no sir. It would change the discount from 10% to 20%,
rerun the test, and when it passes anyway, it would call your bluff.

[^1]: This is a hypothetical example, but it is _exactly_ what I have done. I
    got too preoccupied with investigating a different part of the codebase and
    with writing tests, and forgot about un-hardcoding my dummy test values. The
    result was meaningless tests. Yikes.

This is not a hypothetical. Mutation testing catches exactly these kinds of
failures: logic that appears tested but is not meaningfully verified. Silent
bugs. Assumptions that you didn't realize your tests were making. All the things
that lead to 2AM incident reports and embarrassing root cause writeups, or maybe
an apology to your co-maintainers...

And once you start using it, your relationship with testing changes. You stop
writing tests to satisfy metrics. You stop writing tests for the CI badge. You
start writing tests with intent because you know they'll be interrogated. This
does something subtle, but powerful: it aligns testing with reality. Code is
messy, deadlines exist, teams rotate, and not every dev has full context.
Mutation testing cuts through that by asking the only question that matters: if
this breaks, will anyone notice? The answer is "no" more often than it is "yes,"
because the noticing part usually comes when something _does_ break.

When you start to see mutants surviving---mutants that change core logic, edge
cases, or conditional flows---it stings, it becomes a scratch that you _must_
scratch. But it also shows you exactly where your testing assumptions were too
generous. That makes mutation testing a better code reviewer than most humans.
It doesn't praise you for structure. It doesn't care if your mocks are elegant.
It just says: this logic was wrong, and nobody noticed. It might even add a
subtle "fuck you" sometimes.

Of course, you don't run this on every commit. Mutation testing is heavy. Too
heavy, especially for languages like Rust. You run it during quiet phases. You
target it at critical modules. You use it to audit tests after big refactors.
And over time, you build up a sense for the kind of brittle logic that needs
better test discipline.

In some ways, mutation testing is the opposite of test-driven development. TDD
is aspirational. You write tests for the code you intend to write. Mutation
testing is cynical. It assumes your code is garbage, [^2] and dares your tests
to prove otherwise.

[^2]: How often is it not, lol.

That tension is useful. Developers often lean too far in one direction: either
overly optimistic about what their tests catch, or so cynical they abandon
testing altogether. Mutation testing grounds both extremes. It doesn't require
faith. It just produces data. Data that tells you, without ceremony, what
would've slipped through. [^3]

[^3]: And maybe that's what makes mutation testing hard to sell. It doesn't
    flatter you. It shows you the difference between looking tested and being
    tested. Between surface coverage and real confidence.

When you are building something that matters, however... Perhaps an API others
depend on, an authentication system, anything stateful or money-related. This is
the kind of tool you'll wish you'd introduced earlier. You simply cannot afford
the fluff, you MUST test.

## Postscript

If you have never used mutation testing, don't start with the whole codebase.
Instead, pick one module you think is "well tested" and run a mutation tool on
it. Watch how many mutants survive. That first run will teach you more about
your tests than hours of code review ever could.

And if nothing survives? Congratulations. Your tests actually work. That means
something. Give yourself a pat on the back.

Not because a metric says so, but because you tried to break your code _and it
held its ground_. Congratulations.

### Mutation Testing in Rust: cargo-mutants

[cargo-mutants]: https://mutants.rs

Rust is uniquely positioned to benefit from mutation testing, and
[cargo-mutants] is the tool that makes it possible. It's small, sharp, and
well-informed just like the language itself. It works with Rust's compilation
model, not against it. It generates mutants at the source level, one mutation
per run, compiles them, and executes the tests---all while preserving the
surrounding structure. It doesn't really try to be clever about parsing Rust. It
uses the compiler.

This is important because Rust's strict type system and ownership rules make
traditional mutation tools (often written for dynamic or loosely typed
languages) struggle to produce meaningful changes. Most random mutations won't
even compile. cargo-mutants appears to be understanding this, so it carefully
selects mutations that produce valid, buildable code. That level of respect for
the language is rare in tooling. It also integrates tightly with the way Rust
projects are structured. It knows about your `Cargo.toml`, about test targets,
about workspace layouts. It even detects and reports untested public items,
things that your code exposes but no test ever touches. That alone is worth the
install.

The result is a tool that doesn't just churn through changes for the sake of
metrics. It highlights real testing blind spots in real-world Rust code. And it
does so without you having to leave the comfort of cargo. What's _especially
admirable_ about cargo-mutants is its humility. It doesn't overpromise. It
doesn't pretend mutation testing is a silver bullet. It just methodically shows
you where your test suite is asleep at the wheel, and in doing so, quietly
encourages better code, not just better coverage.

## Closing Thoughts

I discovered mutation testing today almost by accident. I was reading
documentation for something else entirely. And like most good tools, it
immediately reframed how I think about code quality. It's rare that a testing
technique feels like a missing piece, but this one does. Not because it's
complex, but because it asks the question we should've been asking all along:
what if this code breaks, will my tests even notice? Mutation testing does not
offer comfort. It offers clarity. And in a field full of false confidence and
cargo cult coverage, that's exactly what I didn't know I needed.

As a final note, I would like to remind you that mutation testing _is_ heavy.
With cargo-mutants, it has taken me around an hour to test around 2000 lines of
code. Though my hardware is not the best, I can't imagine having to spend around
an hour every time I have to evaluate my codebase for the possibility of
regressions. It is critical that we learn to evaluate the codebase mentally as
if mutation tests will be ran on it _anyway_.

Cheers!
