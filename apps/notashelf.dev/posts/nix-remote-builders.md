---
title: "Nix Remote Builders"
description: "Taking full advantage of Nix's scalability."
date: 2025-02-17
keywords: ["nix", "nixos", "tutorial", "linux"]
---

# Getting Remote Builders to Build your Nix Derivations

Nix is a package manager--nay, a _build tool_[^1] that is capable of scaling
both vertically and horizontally through its **Binary Caches** and **Remote
Builders** respectively.

You are introduced to the binary cache as soon as the moment you begin the
installation process of NixOS. The ISO image you download, minimal or one of the
graphical flavours, is built by Hydra [^2] as a result of a particular
combination of module option combinations in Nixpkgs. In this sense, NixOS is a
build artifact. It consists of many derivations that are put in a particular
configuration, and built in a particular way to result in a NixOS ISO image. The
images, or a common NixOS system, consist of many derivations.

Although Nix has a strange concept of dependencies, let us try to count
everything that contributes to the building of your final system.

```bash
$ nix-store -q --requisites /run/current-system | cut -d- -f2- | sort | uniq | wc -l
2956
```

This is by no means 100% accurate, but it gets somewhat close. My system is the
result of around 3000 separate derivations, that would need to be built if not
for the binary caches Nix pulls built derivations from. Similar to the
installation ISO images, Hydra builds and caches most of the derivations [^3] so
that you may pull them from `https://cache.nixos.org`. All things considered,
the binary caches are distributed (and load balanced) for global reach. [^4]

## Remote Builders

The topic I wanted to talk about today is **Remote Builders**, a less frequently
employed method for scaling. Remote builders require additional setup, as they
execute builds on an authorized machine rather than pull built results from a
cache. While building things that might not be available in a public cache, you
may offload build steps to a remote machine instead of using your current
machine in the case your build process requires compilation, and higher resource
usage. In this case, a machine with more resources can speed-up the process.

The structure of Nix remote builders consists of two components:

1. Local Machine
2. Remote Machine(s)

There is no limit to how many machines you may distribute your builds upon.

### Remote Machine

For the sake of simplicity, let us assume that there is one remote builders that
you would like to utilize for your builds. Nix utilizes remote builders by
opening SSH connection to the target machine, so you must first have a user with
SSH access on the target machine. Let's call this user `builder`. You must mark
this user as a "trusted user" (_users that have additional rights when
connecting to the Nix daemon, such as the ability to specify additional binary
caches, or to import unsigned NARs._) to utilize this user for remote builds.

On a typical NixOS setup, you would do so by adding it to `trusted-users`:

```nix
{
  nix.config.trusted-users = ["builder"]; # you may also use @groups instead
}
```

Once you make sure that the `builder` user on the remote machine is accessible
via SSH, and is marked as a trusted user, try offloading a build to the remote
machine to test your connection:

```bash
nix build nixpkgs#hello --rebuild --builders "ssh://builder@ssh.example.tld"
```

You can replace `ssh.example.tld` with a domain pointing at your server, or just
the raw IP address of your machine. If SSH is running a port other than `22` on
your machine, then you may also specify an alternate port to be used with the
`NIX_SSHOPTS` environment variable. For example:

```bash
export NIX_SSHOPTS="-p 2222"
nix build nixpkgs#hello --rebuild --builders "ssh://builder@ssh.example.tld"
```

Would open a connection over port `2222` instead of the default `22`.

### Local Machine

This is a good time to warn you that sometimes, especially if your connection is
shaky, adding remote builders to the mix might slow things down. Remember that
everything built on the server will have to be sent back to your local machine
to complete the final closure. However, if you are positive that remote builders
are good addition and the network effects are negligible, then you may configure
Nix to utilize certain builders on each build.

```nix
{
  # https://wiki.nixos.org/wiki/Distributed_build
  nix.buildMachines = [
    {
      hostName = "ssh.example.tld";
      sshUser = "builder";
      # 'ssn-ng' is faster if both machines are NixOS but falls flat if the
      # machine Nix will attempt a connection to is not NixOS. In such a case
      # you must use 'ssh' instead.
      protocol = "ssh-ng";

      # This can be an absolute path to a private key or it can be managed
      # with something like Agenix, or SOPS.
      sshKey = "/home/user/.ssh/builder-rsa";

      # Systems for which builds will be offloaded.
      systems = ["x86_64-linux" "i686-linux"];

      # Default is 1 but may keep the builder idle in between builds
      maxJobs = 3;
      # How fast is the builder compared to your local machine
      speedFactor = 2;

      supportedFeatures = ["big-parallel" "kvm" "nixos-test"];
    }
  ];
}
```

The above configuration sets up `/etc/nix/machines`. If you are setting up
remote builders on non-NixOS, you will need to manually construct the contents
of that file.

> A cool trick, if you are self-hosting Hydra, is that Hydra can pick up remote
> builders if you tell it to. How you can do this is documented in the Hydra
> manual, but you might consider self-hosting Hydra on your desktop or a weaker
> machine like a Raspberry Pi while utilizing a stronger machine for remote
> builds.

`nix.buildMachines` also plays very nicely with your SSH configuration. For
example in the case of unique ports, you may use `programs.ssh.extraConfig`. For
example:

```nix
{
  programs.ssh.extraConfig = ''
    Host remote-builder
      User builder
      HostName ssh.builder.tld
      Port 2222
      IdentityFile /home/user.ssh/builder-rsa # As before, Agenix will work here
  '';
}
```

Specifying your connection details in `programs.ssh.extraConfig` is a more
sophisticated way of configuring the SSH connection that will be established on
remote builds. As such, you may omit `NIX_SSHOPTS` and connection information.
For the command-line example, you may now use `protocol://host`.

```bash
nix build nixpkgs#hello --rebuild --builders "ssh://remote-builder"
```

If there are more than one builder that you would like to use, lets call them
`remote-builder1` and `remote-builder2`, you can specify them in the
`--builders` flag, separated by spaces.

```bash
nix build nixpkgs#hello --rebuild --builders "ssh://remote-builder1 ssh://remote-builder2"
```

## Closing Thoughts

That should be everything you need to configure remote builders on your system.
If you have a Tailnet, via Tailscale, you may utilize MagicDNS or something
similar to simply query builders by hostname and partially skip the SSH
configuration. E.g., `ssh-ng://builder@my-host` where my-host is available on
your Tailnet, and systemd-resolved is asked to search your Tailnet domain.

In the case your local system is too weak, you may also consider passing
`--max-jobs 0` to the build command to execute _all_ build tasks on your
available remote machines. I pass `--max-jobs` to the `nixos-rebuild` command
when I am attempting a rebuild on my weakest machine, which only has 4gb RAM
available, to avoid running my system out of resources.

A very cool, but somewhat unrelated trick, is that you can use `--build-host` in
`nixos-rebuild` to build on a remote host.

[^1]:
    Nix, although most commonly referred to as a "Package Manager" is actually
    a build tool. Some find this definition pedantic, but package management is
    only a subset of what it is actually capable of. Calling it a package
    manager is fair, but also a bit reductive in a way that it does not
    communicate Nix's advantages over traditional package managers.

[^2]:
    Hydra is a Nix-based continuous build system, tasked for evaluating and
    building derivations from a jobset such as but not limited to Nixpkgs. In
    the context of Nixpkgs, Hydra is what populates the cache, logs evaluation
    or build failures, and makes channels available.

[^3]:
    _Some_ derivations are not built and therefore not available in the cache.
    There are a few different conditions for this, but it is the case especially
    when the derivation has been marked specifically not to be built by Hydra.

[^4]:
    This should show you how fragile the Nix infrastructure is. As much as I
    am a huge fan of Nix, Nixpkgs and NixOS, without the proper funding Nix's
    adoption would not be possible. _Nobody_ wants to build everything from
    source, all of the time. Even though content-addressed Nix would make
    rebuilds less troublesome, this is a problem to ponder on while considering
    the future of Nix and NixOS.
