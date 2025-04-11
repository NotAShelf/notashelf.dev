---
title: "NixOS Testing Framework I: On VM Tests"
description: "Introduction to the NixOS testing framework with flakes"
date: "2025-04-03"
keywords: ["nix", "nixos", "tutorial"]
---

# Integration tests with NixOS VM Tests

One of the things that convinced me to _stay on NixOS_ was how easy it is to
write integration tests for my existing infrastructure. Unlike traditional
testing setups, which often require complex tooling, manual configuration, or
fragile dependencies, NixOS makes testing nearly effortless. In fact, Nixpkgs
itself contains tests for even the most trivial cases---proving just how
seamless the process can be. If you've ever struggled with testing your services
in other environments, where dependencies shift and system configurations break
unpredictably, then this post might convince you to give NixOS a second look.

Today's article walks you through setting up your own integration tests outside
the context of Nixpkgs. I'll also briefly touch on how tests are executed within
Nixpkgs itself. Not long ago, the testing framework underwent some internal
changes, and now that `testers.runNixOSTest` is stable, I believe it's the
perfect time to explore how you can leverage it for your own projects.

## Obtaining Nixpkgs

We must first obtain the testers from somewhere. That somewhere is---
naturally---Nixpkgs.

Testers are `system` dependent, and they are dependant on `pkgs`. I don't think
this is a surprise to anyone since we will be interacting with, well, packages
but the caller for `runNixOSTest`
[especially sets hostPkgs](https://github.com/NixOS/nixpkgs/blob/230479874c95697578c56179905e4acf97d23e4d/pkgs/build-support/testers/default.nix#L168).

That said, we will need to instantiate `pkgs` somewhere. Usually in Nixpkgs you
are already in a scope that provides testers, but since we are working _outside_
Nixpkgs for the purposes of this post, let's get `pkgs` rolling. While I'm at
it, I'll also provide a self-contained `flake.nix` that fetches and locks a
Nixpkgs instance for us.

```nix
# flake.nix
{
  inputs.nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
  outputs = inputs: {
    # No import required unless you want to propagate `inputs` to the module
    nixosModules.default = ./your-service.nix;
  };
}
```

Let's assume for the purposes of this post that you have a small NixOS module
that you want to execute tests for. This can be a short and simple Python script
for a webserver, a VPN mesh controller, or anything that you might have
expressed in a simple NixOS module. Let's also assume that whatever this service
might be, it serves a HTML page with... healthcheck information over at port
`3000`. Got anything in your mind yet?

## Writing the Test

One of the many handy features of flakes is that you can define _checks_ that
will be built on `nix flake check` unless `--no-build` is passed. While I'm
testing outside resource constrained environments, I prefer to execute my VM
tests directly on check because that is two birds with one stone.

Let's extend the `flake.nix` from above with a check that will be built on
`nix flake check` or manually with `nix build .#checks.<system>.your-check`.
Since this is meant to serve as an example, I have omitted the system
abstractions and we will be testing for a single system only. You may change
this however as you see fit. The key point here is to define a 'package' using
`runNixOSTest` that will be executed in a way that you see fit.

```nix
{
  inputs.nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
  outputs = inputs: {
    nixosModules.default = ./your-service.nix;

    checks = let
      system = "x86_64-linux";
      pkgs = inputs.nixpkgs.legacyPackages.${system};
    in {
      "${system}".default = pkgs.testers.runNixOSTest { /*...*/ };
    }
  };
}
```

Here is how our flake will look like, for now. I want to explain the potential
arguments to `runNixOSTest` to give you an idea before I write the rest of the
test to give you an idea before I write the rest of the test.

## Anatomy of `runNixOSTest`

`runNixOSTest` is a wrapper function around `runTest` from Nix_OS_ (not
nix_pkgs_) library, defined in
[nixos/lib](https://github.com/NixOS/nixpkgs/tree/7d5cd42fece2ae9b065b00c08696b439a864401f/nixos/lib).
It imports `nixos/lib/default.nix` and wraps the `runTest` function that is
defined in NixOS library, which is _inherited from the testing library inside
the NixOS library inside nixpkgs..._ Ugh.

Regardless, and in the spirit of `runTest`, there are a few paramaters that you
can pass to `runNixOSTest`. I will not be covering _all_ of them, but here are
those that you _want_ to pass for a functional test.

```nix
runNixOSTest {
  # First, the 'name' parameter. This will determine the name of the package
  # that you will be building, but from what I can tell, not much else. For
  # example a test with the name "my-test" would result in "vm-test-run-my-test"
  # being built.
  name = "my-test";

  # Next up is nodes. This is where it gets interesting, because you can define
  # as many nodes as you deem necessary in this set. More importantly, those
  # nodes are allowed to interact with each other inside the texting context.
  nodes = { /* ... */ };

  # Last but not least, the test script. The test script is what I would call
  # a *flavored* Python script, where you get access to a few special machine
  # objects as a part of Nixpkgs, and the documentation describes it as a
  # "...sequence of Python statements that perform various actions, such as
  # starting VMs, executing commands in the VMs and so on."
  testScript = "";
}
```

There are a few other parameters that you can use, such as `extraPythonPackages`
that you can use to add additional Python libraries in the script. Though I'm
getting ahead of myself, we're here to talk about writing tests.

## Writing the Test: Continued

As I was saying. Now that we know how a test looks like, lets write it for real
this time.

```nix
{
  inputs.nixpkgs.url = "github:nixos/nixpkgs?ref=nixpkgs-unstable";
  outputs = inputs: {
    nixosModules.default = ./your-service.nix;

    checks = let
      system = "x86_64-linux";
      pkgs = inputs.nixpkgs.legacyPackages.${system};
    in {
      "${system}".default = pkgs.testers.runNixOSTest {
        # This can be anything. I like giving my test special
        # codenames. Yes, I'm quirky like that.
        name = "narwals-are-awesome";

        # Let's go with a single-node test, for now. I'm going to add an example
        # at the end of this post to give you an idea of multi-node tests.
        nodes = {
          # Names of the nodes are up to you as well. They expose the same
          # objects regardless of names, though 'machine' is mostly standard, so
          # I will go with that for now. As a bonus, you can read this with the
          # voice of Gianni Matragrano, who is said to voice anyone for a
          # chicken nugget.
          machine = {pkgs, ...}: {
            imports = [ inputs.self.nixosModules.default ];
            environment.systemPackages = [ pkgs.curl ];

            # Enable the service. This does not exist in Nixpkgs and
            # is added by our nixosModule. You can enable anything defined in
            # nixpkgs inside a machine's configuration *and* extend them with
            # your own NixOS modules.
            services.syshc.enable = true;
          };
        };


        # Now the test script. You can add a comment like /* python */ before
        # the body of this string to provide syntax highlighting via Treesitter
        # if your editor is Neovim. Neat!
        # The script will start all available nodes, wait for the service to
        # start, and then the port. Lastly it will query the / endpoint to look
        # for a specific value that indicates success. Your test cases may be
        # more complex than this, in which case you can write a more detailed
        # Python script.
        testScript = /* python */ ''
          # Function to start *all* nodes at once. This can be used as an
          # alternative to <nodename>.start() (e.g. `machine.start()`) when
          # you have multiple nodes.
          start_all()

          # wait_for_unit is a special object that will wait for a Systemd
          # unit to get into "active" state. Throws exceptions on "failed"
          # and "inactive" states as well as after timing out.
          machine.wait_for_unit("python-server")

          # Also wait for an open port on the node. In my script the service
          # binds to port 3000, so we must wait for it to open.
          machine.wait_for_open_port(3000)

          # Finally lets log the output from the service. In my example the
          # server logs health information directly in /, but you may get the
          # information from anywhere.
          status = machine.succeed("curl --fail localhost:3000")

          # Check if our server returns the expected result.
          assert "Healthy" in status, f"'{status}' is not healthy! Check failed."
        '';
      };
    };
  };
}
```

## Running Your Test

Now lets build the check with some verbosity. `-L` will tell the tester to print
all logs from the test, and `v` adds some verbosity to the Nix builder.

```bash
nix flake check -Lv
```

And this will print a lot of logs. Let's isolate the output that we really care
about.

```console
vm-test-run-narwals-are-awesome> (finished: waiting for TCP port 3000 on localhost, in 18
vm-test-run-narwals-are-awesome> machine: must succeed: curl --fail http://localhost:3000
vm-test-run-narwals-are-awesome> machine #   % Total    % Received % Xferd  Average Speed
vm-test-run-narwals-are-awesome> machine #                                  Dload  Upload
vm-test-run-narwals-are-awesome> machine #   0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0[   34.854829] syshc[637]: 127.0.0.1 - - [04/Apr/2025 09:49:17] "GET
 / HTTP/1.1" 200 -
vm-test-run-narwals-are-awesome> machine # 100   115  100   115    0     0    108      0  0:00:01  0:00:01 --:--:--   108100   115  100   115    0     0    107      0  0:00:01  0:00:01 --:-
-:--   107
vm-test-run-narwals-are-awesome> (finished: must succeed: curl --fail http://localhost:3000, in 1.43 seconds)
vm-test-run-narwals-are-awesome> (finished: run the VM test script, in 36.99 seconds)
vm-test-run-narwals-are-awesome> test script finished in 37.09s
vm-test-run-narwals-are-awesome> cleanup
```

And there it is. This waits for port 3000, curls it, gets the result and parses
it. Since the server returned "Healthy", the check has completed successfully.
Nice.

## Closing Thoughts

Hope this article has served to give you an idea of how you may utilize NixOS
testing framework for your projects. At least a very basic idea, enough to help
get you started. Though there is much more to this framework, and more
conditions that you might want to be aware of.

As such, I invite you to reach out to me and let me know of any additional cases
that you want me to cover. I am happy to help clarify testing with NixOS, as I
think it should be done more often outside of Nixpkgs. Moreover, this is not the
end of this topic. I would like to cover the aforementioned special objects, and
more complex cases surrounding multi-machine test scenarios. I also want to go
over _interactive_ tests, but that will have to be for another post. Cheers
