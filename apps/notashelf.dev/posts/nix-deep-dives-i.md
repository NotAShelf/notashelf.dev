---
title: "Nix Deep Dives I: Shell Environment Setup"
description: "Taking a closer look at how Nix shells really work."
date: 2025-06-01
keywords: ["nix", "nixos"]
---

# Nix Deep Dives I: Shell Environment Setup

Nix is an interesting beast. I hated it at first--too complex, too alien, too
_much_. But like an obscure language you force yourself to learn for a trip that
keeps getting postponed, it grew on me. Eventually, that complexity stopped
feeling like a wall and started feeling like an invitation.

So here we are.

Most posts I have written about Nix focus on _using_ it. This one is different.
This is me crawling through its internals to understand _how_ it works. Because
I think if you use something every day, it is worth knowing what it’s actually
doing under the hood.

If you are unfamiliar with Nix, this interesting and complex tool, it is
designed to produce reproducible builds by running each build within a carefully
controlled shell environment. In this entry, we take a closer look at how Nix
constructs and cleans this environment by examining a key section of
`nix-build.cc`.

## Nix Shells

When a build begins, Nix creates a temporary script. A kind of runtime
configuration file often referred to as an "rc file." This file is central to
the build process, as it ensures that the build process is and remains isolated
from _any_ external or preexisting system settings. This process involves not
only setting up the necessary environment variables and paths but also defining
a robust cleanup mechanism that runs regardless of the build outcome.

The following snippet from `nix-build.cc` illustrates the construction of the rc
file:

```cpp
// Oh my god it's just all bash...
std::string rc = fmt(
    (R"(_nix_shell_clean_tmpdir() { command rm -rf %1%; };)") +
    "trap _nix_shell_clean_tmpdir EXIT; "
    "exitHooks+=(_nix_shell_clean_tmpdir); "
    "failureHooks+=(_nix_shell_clean_tmpdir); " +
    (pure ? "" : "[ -n \"$PS1\" ] && [ -e ~/.bashrc ] && source ~/.bashrc;") +
    "%2%"
    "unset PATH;"
    "dontAddDisableDepTrack=1;\n"
    + structuredAttrsRC +
    "\n[ -e $stdenv/setup ] && source $stdenv/setup; "
    "%3%"
);
```

This code builds a string that will eventually serve as the rc file for the
temporary build shell. The first part of the string defines a function,
`_nix_shell_clean_tmpdir` which is responsible for removing a temporary
directory via a simple file system command.

Note the usage of the trap command, which makes sure that this cleanup function
is automatically invoked when the shell exits--whether the build ran to
completion or encountered an error. This mechanism is critical. It prevents
residual temporary data from lingering on the filesystem, which could otherwise
lead to unintended interference in subsequent builds or system clutter.

Another significant aspect of this setup is the conditional sourcing of the
user's `.bashrc` configuration. In builds that are not running in pure mode, the
snippet includes a check for an interactive shell (`$PS1`) and the existence of
the `.bashrc` file. Sourcing it allows the user to benefit from familiar command
line customizations even within the build environment, at the cost of pure and
predictable build outputs. However, in pure builds, user-specific configurations
are deliberately excluded to ensure that external factors do not influence the
build process.

Additionally, the code purposefully unsets the `PATH` variable. By clearing
`PATH`, Nix ensures that the build does not inadvertently pick up programs or
scripts from unexpected locations on the host system. This reinforces the
principle of reproducibility, as the build environment contains only explicitly
allowed binaries and paths. Through this careful control of environmental
variables, Nix minimizes the risk of variability between builds on different
machines or at different times.

After preparing the basic environment, the script adds more configuration as
needed, using the contents of `structuredAttrsRC`. It then checks for the
standard setup script at `$stdenv/setup`. If that script is present, it gets
sourced, which can set up additional environment variables or perform other
setup steps required for the build.

This setup is straightforward: it aims to keep the environment clean,
predictable, and free from surprises. By removing hidden dependencies and side
effects, Nix makes sure that builds are consistent and reliable. Cleanup hooks,
strict environment variable handling, and conditional configuration are all
essential parts of how Nix achieves this.

---

Hope you enjoyed this post. This is a little unusual for me as I usually talk
about how to use Nix rather than how Nix is built, but it was a fun experience
looking into Nix's source code. In upcoming entries of this series, I would like
to further explore how Nix handles the evaluation of derivations, manages
dependencies, and reconciles the differences between pure and impure builds.

Let me know if you enjoyed this post and would like more deep dives, or let me
know if you _didn't_ enjoy this post and would rather I stick to my usual posts.
Cheers!
