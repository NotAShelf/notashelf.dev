---
title: "Lazy Evaluation in Nix: Where Your Conditionals Go to Die"
date: "2025-01-30"
description: "Exploring lazy evaluation in relative depth"
keywords: ["nix", "programming"]
---

# Lazy Evaluation in Nix: Where Your Conditionals Go to Die

If you have spent time in traditional programming languages, then you have
probably relied on conditionals (`if-else`, `switch`, `case`) at least once in
your life. In Nix, as a grace of lazy evaluation, many of those construct become
less relevant---or outright unnecessary. This post dives into _why_ this is the
case, and hopes to save you from a few pitfalls that come with this.

## What is Lazy Evaluation?

I first need to explain what Lazy evaluation is. Not just within the context of
Nix, but in programming in general.

Lazy evaluation means that expressions are not evaluated until their values are
actually needed. This is in contrast to strict (or eager) evaluation, where
expressions are computed as soon as they are bound to a variable. In more
practical terms, lazy evaluation helps avoid unnecessary computations by
delaying the evaluation of expressions. It's a powerful technique for improving
performance and managing resources efficiently.

### Laziness in Haskell

```haskell
lazyNumbers :: [Int]
lazyNumbers = [1..]

firstFiveNumbers :: [Int]
firstFiveNumbers = take 5 lazyNumbers
```

In this example `lazyNumbers` is an infinite list. However, the values are not
computed all at once. The `take 5 lazyNumbers` expression only computes the
first 5 elements of the list when required. That is the most typical example of
lazy evaluation I can think of. Key point is that the numbers are only generated
when needed, instead of being computed upfront.

### Laziness in Python

With some friction, we can implement lazy iteration in Python.

```py
def lazy_numbers():
    num = 1
    while True:
        yield num
        num += 1

lazy_gen = lazy_numbers()
first_five_numbers = [next(lazy_gen) for _ in range(5)]
print(first_five_numbers)
```

In this example, `lazy_numbers()` is a generator that lazily yields numbers
starting from 1. Unlike a typical _list_, the numbers are not computed all at
once. The `next(lazy_gen)` call only computes the next number when needed. So,
when we request the first five numbers, only the first five numbers are
generated.

In Nix, laziness manifests in several ways:

- **Unused branches of an if-else are never evaluated.**
- **Function arguments are not evaluated unless explicitly used.**[^1]
- **Attribute sets can include self-referential definitions, leading to infinite
  recursion errors only when an attribute directly refers to itself.**[^2]

[Statix]: https://github.com/oppiliappan/statix

[^1]: Static analysis tools, such as [Statix] will warn you when the function
    argument is unused. For example in the `alwaysReturnOne` function I've used
    as an example above, Statix would've warned you about the unused argument
    `x`.

[^2]: This is possible due to lazy evaluation resolving circular dependencies
    without causing crashes. However, an infinitely recursing attribute can
    exist as long as it's not evaluated.

## The Death of Conditionals (or at Least Their Diminished Role)

In strict languages, conditionals are usually used to prevent expensive
computations from running unnecessarily. But in Nix, the very nature of laziness
means that an expensive computation inside an unused branch never executes.

Example:

```nix
let
  expensive = builtins.trace "This should not print!" (throw "Error");
  value =
    if false
    then expensive
    else "Safe";
in
  value
```

In an eagerly evaluated language, this would result in an error because
`expensive` would be computed before `if` even runs. In Nix, however, the
`false` branch is never evaluated, so the program executes safely.

## Functions: Only Compute What is Needed

Since function arguments are evaluated lazily, unnecessary computations can be
avoided naturally.

```nix
let
  alwaysReturnsOne = x: 1;
in
  # The throw becomes the function argument here, which is x.
  # Since x is never evaluated, nor is the throw so the program
  # will continue.
  alwaysReturnsOne (throw "This should never be evaluated")
```

Even though we pass an expression that would normally cause an error, it is
never evaluated since `x` is not used inside the function body.

## Self-Referencing With and Without Infinite Loops

Nix allows for self-referential structures, but only if evaluated lazily. Direct
cyclic dependencies will cause infinite recursion unless structured carefully.

```nix
let
  # rec is a special form in Nix used for defining recursive
  # attribute sets, allowing circular references to resolve
  # lazily without infinite loops. You will find out very
  # quickly, however, that it is often discouraged.
  infiniteRec = rec {
    a = b + 1;
    b = let
      # This would cause an infinite recursion if it was evaluated
      # but the variable `infrec` is never referenced, so it passes.
      infrec = a - 1;
    in
      42;
  };
in
  infiniteRec.a  # Evaluates safely
```

This works because what would cause the infrec is never evaluated. If the
evaluator even touched the variable `infrec`, the program would immediately face
and infinite recursion. Instead, it uses the fixed value `42` from `b` so `a`
can refer to `b` safely.

Here is an example that would fail.

```nix
let
  infiniteRec = rec {
    a = b + 1;
    b = a - 1;
  };
in
  infiniteRec.a  # Infinite recursion
```

Here both `a` and `b` depend on each other without a base case, which results in
infinite recursion. The only way to prevent this is to explicitly anchor one of
the values with a concrete number or expression that doesn't rely on the cycle.

> Infinite recursion is not as straightforward as it looks here. While working
> with small sets and short files you can _easily_ identify where the infinite
> recursion comes from. While using the module system to break your code into
> multiple files, or even repositories, you might have more difficulty
> identifying where exactly it comes from, because you will notice that error
> messages are as clueless as you are. We'll talk about the costs of deep
> abstractions in another post.

### What is `fix`?

`fix` is a function used in some functional languages (such as Haskell) to
define recursive expressions without requiring explicit naming. It applies a
function to itself, allowing the expression to refer to itself.

```hs
fix f = f (fix f)
fact = fix (\rec n -> if n == 0 then 1 else n * rec (n - 1))
```

In strict (non-lazy) languages, recursion requires named definitions, such as
explicitly defining fact and referencing itself. Without laziness, a function
cannot pass itself as an argument to another function without being fully
evaluated first---leading to a situation where the function reference does not
exist at the time of evaluation. The fix function allows recursion to be encoded
explicitly by ensuring that a function can reference itself even in strict
evaluation contexts.

```nix
let
  factorials = rec {
    zero = 1;
    fact = n: if n == 0 then zero else n * fact (n - 1);
  };
in
  factorials.fact 5  # Evaluates to 120
```

Here, fact refers to itself without requiring an explicit fixed-point combinator
like `fix`. This is because Nix only evaluates values when needed, meaning
references can exist without being immediately resolved. In contrast, strict
languages would require fix to explicitly establish recursion. [^3]

[^3]: I'm very well aware that there is a `fix` function in nixpkgs lib. I
    mainly want to focus on core Nix language, so applications of `lib.fix` are
    omitted this time around. I'd like to talk about `fix` and recursion
    specifically in another post, another time. This is already long as it is.

```js
const factorial = (n) => (n === 0 ? 1 : n * factorial(n - 1));
```

Here, factorial is explicitly named, allowing it to refer to itself. However, if
we wanted to define it without naming it explicitly, we would need something
like `fix`.

```js
// Why yes I've used Javascript as an example for a good reason.
// The reason is that if I've suffered with writing Haskell, then
// you must suffer reading Javascript. Ha.

// `fix` is a function that helps a function call itself
// It takes a function `f` as an argument and returns `f` applied to itself
const fix = (f) => f((x) => fix(f)(x));

const factorial = fix(
  (rec) => (n) =>
    // Base case: if n is 0, return 1 (because 0! = 1)
    n === 0 ? 1 : n * rec(n - 1), // recursive case: multiply n by the factorial of (n-1)
);

console.log(factorial(5)); // 120
```

Thus, while fix is necessary for recursion in strict evaluation, Nix's lazy
evaluation makes it unnecessary, allowing for powerful self-referential
structures with _careful_ structuring.

### Other Examples

To help give you an idea of what lazy evaluation can do for you, e.g. in your
NixOS configuration, I'd like to demonstrate laziness in action.

**Lazy Lists**

In Nix, you can define infinite data structures like lazy lists without causing
infinite loops:

```nix
let
  lazyList = {
    head = 1;
    tail = lazyList.tail; # this is an infinite recursion, if it evaluates...
  };
in
  lazyList.head
```

**Delayed Computation in Attribute Sets**

```nix
let
  config = rec {
    setting =
      if useAdvanced
      then builtins.throw "Too expensive!"
      else "default";
    useAdvanced = false;
  };
in
  # evaluates to "default", error is never thrown
  config.setting
```

## Conclusion

Laziness is powerful, but it can lead to surprises:

- Debugging is harder because errors might not surface until a deeply nested
  expression is finally evaluated. `--show-trace` is your friend most of the
  time.
- Performance tuning requires careful observation of when expressions are
  actually computed.
- Memory usage can balloon if large unevaluated thunks pile up, leading to
  unexpected memory pressure. Though, Nix's performance woes come from
  elsewhere.

A very good question would be _"why did you write this post?"_ Truth is, I want
to make it clear that Nix is _not_ one of your traditional languages. There also
seems to be a trend of new Nix/OS users failing to understand Nix _is_ a
programming language, and it is a functional one no less. I wanted to make it
very clear that some of the "issues" (such as dreadfully long error messages)
are an occupational hazard.

To conclude, laziness in Nix removes the need for many traditional control flow
constructs, albeit with its own set of caveats. Rather than guarding expensive
computations with explicit conditionals, you often don't need to worry at
all---unused expressions simply never evaluate. However, laziness introduces its
own challenges, especially when debugging or managing performance. I want to
make it very clear that most of the time, you can overcome those challenges by
simply thinking about how you structure your program. In short, Nix is very
demanding from the user but it almost always returns your investment in full.

Next time you are working with Nix, remember that you are using a domain
specific language that is bound to have its own quirks. Regardless of said
quirks, Nix is a very powerful language that trivializes Infrastructure as Code,
but _only_ if you treat it as code.
