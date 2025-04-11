---
title: "Enter: Beginner's guide to Writing Error Messages"
date: "2025-01-02"
description: "Thoughts and rants on key principles of writing polite, effective and user-friendly error messages"
keywords: ["rant", "software", "thoughts"]
---

# Enter: Beginner's guide to Writing Error Messages

Programs fail, even the best-written ones. You know it; you've experienced it.
You wish you could avoid it, but you can't. Computers are far from perfect. As a
beginner programmer, you quickly learn that you must account for both expected
and unexpected errors. Handling these errors isn't too difficult, and at this
point, you have two options:

1. Throw a stack trace that gives insight into _where_ the error occurred.
2. Provide a human-readable error message explaining the issue (or its absence)
   and offering debugging steps, if applicable.

While you might feel inclined to favor only one of these approaches, the correct
solution is to provide _both_---but under different circumstances. This is where
verbosity comes into play. Too much information can be overwhelming; too little
can be useless. So, what's the perfect middle ground?

## Who asked?

When I visit your website and your backend is down (unbeknownst to me), I
_really_ don't care to see your unhandled error message in full detail. The end
user, who _likely_ has no idea what the error message means, should never
encounter it. It's _you_---the one responsible for fixing the issue---who needs
that detailed information.

The end user should instead see a simple, _polite_ message explaining that
something went wrong and reassuring them that steps are being taken to resolve
it. Offer them hope, not despair. Lie if you must, but don't scare them away.
Keep verbose error messages hidden—where they belong---in your backend.

On the other hand, you _do_ need verbose stack traces or whatever form your
program's detailed crash information takes. You can't omit these, and you
shouldn't. Instead, tuck them behind a flag or log them in a way that's
accessible only to those who need them. Ensure that anyone actively
troubleshooting can easily find this detailed information, while those who don't
need it remain blissfully unaware.

## The Good, The Bad, and Nix

This is a Nix blog, so of course, I'm going to complain about it. Nix has a very
_unique_ (for the lack of a better word) way of reporting errors. If the author
of whatever project you are consuming is thoughtful enough to handle each case
(be it via an assertion, as part of the module system, or with an extensive
conditional), then you're likely to receive a _very_ informative explanation of
what went wrong and how to fix it. The module system is excellent at this.

If the error is _not_ handled, however, you're left with an obscure message
pointing to where the error originates. _Hundreds_ of lines at the very least.
In the context of a NixOS system (i.e. the Nixpkgs module system), errors often
trace back to the entry point of the module system or something generic like
`config` in `specialArgs`. This, folks, is bad design. Not only are you
expecting the user to know exactly what they're looking at (minus points for the
infamous `--show-trace`), but you're also presenting them with an intimidating
wall of text that they'll naturally avoid. It's almost as if you don't want the
error to be resolved...

[Nix 2.20](https://nix.dev/manual/nix/2.25/release-notes/rl-2.20) has made...
some attempts to improve this situation, but the language remains fundamentally
flawed, and such errors are, unfortunately, still unavoidable.

### All your error are belong to us

Here is an example of how I would like to approach errors.

```js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

function logErrorToFile(err, req) {
  const logFilePath = path.join(__dirname, "error.log");
  const logMessage = `
[${new Date().toISOString()}]
Error: ${err.message}
Route: ${req.originalUrl}
Stack Trace: ${err.stack}\n`;

  fs.appendFile(logFilePath, logMessage, (error) => {
    if (error) {
      console.error("Failed to write to log file:", error.message);
    }
  });
}

function errorHandler(err, req, res, next) {
  logErrorToFile(err, req);

  res.status(500).json({
    message: "Something went wrong. We are working to resolve the issue.",
  });
}

// A route that intentionally throws an error
app.get("/error", (req, res, next) => {
  try {
    throw new Error("This is a test error");
  } catch (err) {
    next(err); // we forward the error to the error-handling middleware
  }
});

app.use((req, res) => {
  res.status(404).json({
    message: "The resource you are looking for does not exist.",
  });
});

// Centralized error-handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

In the example above, error-logging and user-response responsibilities are
clearly separated. The `errorHandler` middleware returns a clean and polite JSON
response to the client: _"Something went wrong. We are working to resolve the
issue."_ The user doesn't need to know anything technical, so they don't.
Letting technical information to the frontend is simply poor design.

This, I think, is the golden spot. Easy to maintain, not awful and more
importantly _not_ a thousand lines of meaningless, unintelligible text.

### 404: According to all known laws of aviation...

Now lets consider a bad example. No, a _horrible_ example.

```js
const express = require("express");
const app = express();
const PORT = 3000;

app.get("/error", (req, res) => {
  // Do you want my credit card details as well?
  res.status(500).send(`
        <h1>Error</h1>
        <p>Something  wrong!</p>
        <pre>
            Error: Failed to fetch resource
            at /error:10:15
            at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
            at next (node_modules/express/lib/router/route.js:144:13)
            at Route.dispatch (node_modules/express/lib/router/route.js:114:3)
            at Layer.handle [as handle_request] (node_modules/express/lib/router/layer.js:95:5)
            at /error:10:15
        </pre>
        <pre>
            Environment: ${JSON.stringify(process.env, null, 2)}
        </pre>
    `);
});

// No error handling middleware or logging mechanisms. Vomit everything as is.
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

_Don't ask me where I got that error message._

In this godawful example, the end-user is bombarded with irrelevant technical
details like stack traces and environment variables. This is not only
overwhelming and confusing, but it also exposes sensitive information that
should never be seen by the user. The error message is not actionable and serves
only to frustrate the user. More importantly, it's a security risk—exposing
environment variables could allow a malicious party to take advantage of what
you might consider technical mumbo-jumbo (and therefore safe to spew.)

Moreover, this approach is just plain ugly. A wall of text is neither helpful
nor appropriate for a user who just wants to know what went wrong and if
anything is being done to fix it. Imagine receiving a message like this on your
own, and ask yourself—would you ever come back to this website?

If you take anything away from this, let it be that error handling should always
prioritize clarity, security and proper compartmentalization.

### Final Thoughts: Verbosity as a Tool, Not a Burden

This has been translated from a far less technical rant I've dropped earlier
today on some painful case of error handling[^1]. Looking back, it was not the
first time I've faced bad error handling. Lots of software I use on a daily
basis simply print everything. In hindsight, this status quo is terrible and yet
we continue to endure.

Error handling should not just about fixing problems. It must be moreso about
how you communicate them. I'm sure the programmer who wrote that piece of code
wants to know what went wrong, and where, but I don't. Unnecessary verbosity is
just as harmful as a complete lack of information. So, for the sake of
establishing a standard let me provide the following as a baseline:

1. Tailor to Your Audience: End-users want, nay, _need_ reassurance and
   simplicity. Developers need depth and precision. Separate these layers
   effectively. Verbosity should be _opt-in_. Flags, environment variables,
   configuration options and so on. Don't just vomit information.

2. Respect Security: Never expose sensitive or otherwise unnecessary details to
   the frontend. Verbose logs belong in the backend, under restricted access.
   Security through obscurity is not security.

3. Keep It Manageable: Avoid overwhelming developers[^2] with too much data.
   Structure logs well and keep error messages concise but informative.

This was all from me. If you have anything you want to add, do feel free to
contact me. Let me also know of any unique cases of good and bad error handling
that you might've ran into. Cheers!

[^1]: Now you know where I got the error message.

[Pterodactyl]: https://pterodactyl.io/
[provides helpful steps]: https://pterodactyl.io/panel/1.0/troubleshooting.html#reading-error-logs

[^2]: There are cases where I am both the developer and the end user. Assume,
    for a moment, that I am working on _your_ codebase with minimal exposure.
    Most of your codebase is completely foreign to me. When you throw me a stack
    trace that is all over the place, I am immediately less inclined to
    contribute to your software. **[Pterodactyl]** (the game server management
    panel) has a very special way of handling errors. It spews everything, but
    [provides helpful steps] for the user. This is a good alternative to
    separating layers.
