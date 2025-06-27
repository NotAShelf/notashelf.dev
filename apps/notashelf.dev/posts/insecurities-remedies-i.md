---
title: "NixOS Security I: Systemd"
description: "First installment to a series on securing your NixOS systems"
date: 2025-03-03
keywords: ["linux", "security", "nixos", "tutorial"]
---

A Linux system is a complex ecosystem of components, each with its own set of
vulnerabilities. NixOS is no exception. While its declarative nature provides
some advantages, it is not--nor can it ever be--a silver bullet against the
inherent insecurities that exist in any system. This _status quo_--a state of
perpetual vulnerability--calls you to action.

For the last 6 months or so, I have been focusing on hardening each and every
single component of my NixOS installation. This post, as an attempt to document
my experiences for the sake of establishing a point of reference, marks the
beginning of a series dedicated to hardening the different components of a NixOS
system. Given that NixOS is a systemd-based distribution, we'll start by
focusing on systemd. Over the course of the series, I'll also delve into kernel
and network security, although these topics require further research and are
beyond the scope of this post.

In this installment, we'll explore how you can harden various systemd services
on your system to reduce potential attack surfaces.

## The Problem

Systemd, as a central part of many modern Linux distributions, provides various
utilities designed to streamline system management. However, its centralization
can also mean a single point of failure, and its wide array of features offers a
large attack surface if misconfigured. One of the utilities it offers, which
will come in very handy today, is **systemd-analyze security**.

Go ahead and run `sudo systemd-analyze security` on your system. You will notice
_very quickly_ that it contains a lot of "UNSAFE" and "EXPOSED" services. First
of all, do not worry. Your system is _probably safe_. The assessments done by
Systemd, as I will emphasize time and time again, are **entirely arbitrary**.
They are rule-based score calculations based on your configuration, do not
correspond to or reflect upon the actual vulnerability of your system; there is
more nuance to such vulnerabilities than a rule-based analysis tool can
determine. Indeed, the score assigned to each service is _not_ an indicator of
how secure or insecure it is. It is, however, a start. In the case of Systemd,
hardening services is a second line of defense when the executable the service
is for becomes the vulnerability.

## The Solution

`systemd-analyze security <unit>` generates a score for a given unit, showing
all the used directives. Based on limited information we have, it is possible to
try and harden individual services.

By default, Systemd leaves running services in the open. This is understandable,
as trying to preemptively harden a service is likely to cause conflicts with
individual services and their requirements.

Although NixOS makes _some_ effort to harden services, installed services--be it
through NixOS' services or your inferior distribution's package manager--will be
running with little to no hardening - which you can confirm by viewing the
security report. This post, as per my experience, aims to detail potential
hardening options. Throughout this post, please keep those following core
principles in mind:

1. There is **no** "one size fits all" kind of hardening, all services will
   require your undivided attention to make sure everything continues to work as
   intended.
2. No kind of hardening can catch all kinds of exploits. The key to a secure
   system is to remain ever-vigilant.

> Some hardening options will disable access to certain paths, or make them
> read-only for the service. This is quite helpful, in theory, but not every
> program is written intelligently and as such, not all programs will fail
> gracefully when they are missing access to a path. Sometimes the service will
> fail, and you will not be able to tell why. This is exactly why you must treat
> each service with special care - and harden them one service at a time instead
> of abstracting a generalized way of modifying multiple services at once.

### Hardening Services

[NixOS option search]: https://search.nixos.org/options?channel=unstable&size=50&sort=relevance&type=packages&query=systemd.services.

Systemd services in NixOS are defined through the Systemd module exposed in the
Nixpkgs module system. The schema is very basic, and I suggest that you consult
[NixOS option search] if you wish to learn more. For our purposes, just
`serviceConfig` is enough as we will be working primarily with the `[Service]`
field of systemd services. Documentation is very scattered, but available at
`systemd.unit(5)`, `systemd.service(5)` and `systemd.exec(5)` manpages. They
contain many important tidbids, and I encourage you to go through them alongside
this post during your hardening journey.

Most services enabled in NixOS, such as Miniflux under `services.*`, are
essentially abstractions over `systemd.services` When you enable a service,
you're essentially creating a Systemd service unit via
`systemd.services.<name>`. Unfortunately, there are limited options (usually
limited only to application-specific settings) to harden services through
`services.*` options. Thus, we often need to strip away the abstraction and
modify the settings for the Systemd services directly, using `serviceConfig.`
You should also be aware that some services create more than one service unit,
in which case `systemctl list-units --type=service` can help you find more
services associated with one module.

Here is a very basic example to demonstrate how individual options are applied
to a service.

```nix
{
  systemd.services."<serviceName>".serviceConfig = {
    ProtectClock = true;
    ProtectKernelTunables = true;
    ProtectKernelModules = true;
    ProtectKernelLogs = true;
    SystemCallFilter = "~@clock @cpu-emulation @debug @obsolete @module @mount @raw-io @reboot @swap";
    ProtectControlGroups = true;
    RestrictNamespaces = true;
    LockPersonality = true;
    MemoryDenyWriteExecute = true;
    RestrictRealtime = true;
    RestrictSUIDSGID = true;
  };
}
```

Options set in this example usually enough to bring a service down to MEDIUM
exposure level. It removes some of the "unnecessary" permissions--although they
may very well be necessary-- all services are granted by default. In short this
example _does_ meet _the basic requirements_ for hardening, but it is also not
very comprehensive. For services that reach more into the system, hardening must
be done more diligently: you must assess the needs of your service and tweak its
capabilities accordingly. Furthermore, you will be able to bring the score down
from MEDIUM by focusing on the needs of service and applying other configuration
fields.

To check how effective the change was, run `systemd-analyze security <unit>`
before and after applying service changes, and compare the results. The output
of `systemd-analyze security` will also provide in-depth explanation of each
option that is (or is not) set, so it is worth running frequently on services
that you aim to harden.

#### Definitions

While we are at it, let's talk about definitions. There too many options for me
to cover, and as such this section **will not** cover each and every once of
them. Instead, I would like to focus on the example I have given above to
establish some baseline for how you may look at hardening.

|         Option         | Description                                                 |
| :--------------------: | :---------------------------------------------------------- |
|      ProtectClock      | Prevents procee from accessing the system clock             |
| ProtectKernelTunables  | Restricts modification of kernel parameters                 |
|  ProtectKernelModules  | Prevents loading of kernel modules                          |
|   ProtectKernelLogs    | Limits access to kernel log messages                        |
|      ProtectHome       | Mounts /home, /root and /run/user as read-only tmpfs fs     |
|     ProtectSystem      | Makes `/boot`, `/etc`, and `/usr` directories **read-only** |
|    SystemCallFilter    | Filters out specific system calls                           |
|  ProtectControlGroups  | Restricts use of control groups                             |
|   RestrictNamespaces   | Limits process namespaces                                   |
|    LockPersonality     | Prevents changing process personality                       |
| MemoryDenyWriteExecute | Disallows write-execute memory mappings                     |
|    RestrictRealtime    | Limits real-time scheduling capabilities                    |
|    RestrictSUIDSGID    | Restricts SUID/SGID binaries[^1]                            |

[^1]: SUID (Set User ID) and GUID (Set Group ID) binaries are special
    executables that run with elevated privileges. When executed, they
    temporarily assume the privileges of the owner or group specified in their
    file attributes. This allows certain programs to perform operations that
    would otherwise require root-level access, such as changing system settings
    or accessing restricted files. However, this capability can be misused if
    not properly implemented, therefore it is often restricted through systemd
    unit options like `RestrictSUIDSGID`.

[Systemd Sandboxing Article]: https://wiki.archlinux.org/title/User:NetSysFire/systemd_sandboxing#Common_directives

These are the definitions for some common directives that you may apply with
_minimum headache_. You may stick those into the `serviceConfig` of a service in
your configuration, and if the service is a basic daemon that does not need
intricate FS or memory access, it should perform as expected.

> The draft [Systemd Sandboxing Article] on Archwiki provides some insight on
> other options and their level of impact.

There are many directives that are used in Systemd services, with various
exposure scores. While the scores differ, some of them might come in very handy.
Here are a few that are worth mentioning while you work on hardening your
services.

##### InaccessiblePaths

`InaccessiblePaths` is a very useful directive, which I did not about until
recently, that might come in handy if the service requires access to a lot of
directives. In which case, you may manually add _sensitive_ directories that you
want hidden at all costs.

##### DynamicUsers

Systemd _system_ services (as opposed to user services) run as root unless they
are explicitly given a user to run as. `DynamicUsers` is a special directive
that can help you with _dynamically_ (look I said the thing!) creating separate
user accounts for each instance of the service. Each of these unique users runs
their own instance of the service, providing a high level of isolation between
different processes. This not only enhances security by limiting the potential
impact of a compromised process but also improves resource management by
isolating each instance's file system access. Although the impact of
`DynamicUsers` on a service's exposure score is low, it is a very handy
directive that you might consider if root privileges are not necessary for oyur
service.

##### SystemCallFilter

One noteworthy directive is `SystemCallFilter`. As its name indicates, this
Directive allows restricting syscalls that a service can call. This is very
tricky to work with, and you can get out of hand as the process gains new
features over time. Systemd, to make your life a _bit_ easier, includes
so-called "groupings"-- several groups of system calls, all prepended with `@`.

`@swap`, `@reboot`, `@memlock` and `@raw-io` are some examples of those groups.
You may find a more detailed explanation
[on linux-audit.com](https://linux-audit.com/systemd/settings/units/systemcallfilter/)

##### IP Accounting

With Systemd 235, Systemd was granted ability to track network traffic
statistics for individual services or units. It allows administrators to monitor
bandwidth usage, packet counts, and other network-related metrics associated
with specific systemd services. This feature is implemented through the
`IPAddressAllow` and `IPAddressDeny` directives in the `[Service]`section of a
service unit file.

[awesome article on IP accounting]: https://0pointer.net/blog/ip-accounting-and-access-lists-with-systemd.html

By enabling IP accounting, systemd can provide detailed insights into network
activity, facilitating better network management, troubleshooting, and
performance optimization for services running under its control. Network
security is a little out of my scope today, but I encourage you to read the
[awesome article on IP accounting]

#### Application

From the previous section, you should have a basic understanding of directives
we will be using to harden services. Now let's take a look at the application of
those directives.

> Systemd's error messages for when a service is misconfigured can be vague or
> misleading, especially if the executable fails to properly inform the user of
> the error. [^2] Setting the log level temporarily to debug via
> `systemctl log-level debug` may help getting actually relevant information.
> Though do not rely too much on debug information, as it is usually equally
> useless.

[^2]: [Hint hint wink wink](https://blog.notashelf.dev/posts/2025-01-02-well-done-verbosity.html)

As mentioned above, you might isolate services that need hardening with
`systemd-analyze security <unit>` and focus on hardening each and every one of
them. For example, `systemd-analyze security acpid` returns for me something
like this:

```
✗ RootDirectory=/RootImage=                                   Service runs within the host's root directory                                0.1
  SupplementaryGroups=                                        Service runs as root, option does not matter
  RemoveIPC=                                                  Service runs as root, option does not apply
✗ User=/DynamicUser=                                          Service runs as root user                                                    0.4
✗ CapabilityBoundingSet=~CAP_SYS_TIME                         Service processes may change the system clock                                0.2
✗ NoNewPrivileges=                                            Service processes may acquire new privileges                                 0.2
✓ AmbientCapabilities=                                        Service process does not receive ambient capabilities
✗ PrivateDevices=                                             Service potentially has access to hardware devices                           0.2
✗ ProtectClock=                                               Service may write to the hardware clock or system clock                      0.2
...
```

I have omitted the rest of the output, but you should get a gist of the output
from this example. First field is the directive, second is the impact of the
currently set value and the third field is the "vulnerability score" assigned to
the service. Higher the score, more vulnerable the service. Acpid, for example,
as a score of **9.6**.

Acpid is, of course, not the only example. On my system, there are little over
50 systemd services running and a majority of them were ranked EXPOSED, UNSAFE
or MEDIUM until I went out of my way to harden each and every single one of
them. [^3] My advice to you is to do the same: there are some Nix-based projects
that try and handle hardening for you, but remember that there is no solution
that suits all systems. Not to mention that relying on a 3rd party project for
your system hardening is a security vulnerability of its own.

[^3]: Okay maybe not _all_ of them. It is not feasible to try and harden each
    service, as the minimum required conditions to run some services will always
    remain unsafe by Systemd's definition. This is what I have meant when I
    referred to the scores as arbitrary. Services that run as root, for example,
    can never be fully hardened as running as root is a security vulnerability
    on its own. Trying to offload the service to a dedicated user, or using
    `DynamicUser` might break functionality, therefore some services are bound
    to remain exposed as per Systemd.

[krathalan's systemd sandboxing template]: https://git.sr.ht/~krathalan/systemd-sandboxing

I find that [krathalan's systemd sandboxing template] serves as a good base that
you may apply with minimal tweaks. In addition to providing templates for common
services, it explains how certain options might interact with each other or
system settings while set. Based on this template, manpages and the directives
I've described (or linked) above; you should be able to go over each and every
service that you find to be vulnerable. Keep in mind that it is crucial that you
keep at least _one_ stable generation on your system, as hardening can mess with
even your user accounts, or TTYs as they are _also_ managed by Systemd.

#### Examples

There are many services that score high in Systemd's exposure analysis, but it
is impossible for me to provide configuration options for each service. Instead,
I'll provide some examples for you to base your work off of. Using the
information and sources I have referenced, it should not be very difficult to
harden each individual service.

```nix
{
  systemd.services.acpid.serviceConfig = {
    ProtectSystem = "full";
    ProtectHome = true;
    RestrictAddressFamilies = [ "AF_INET" "AF_INET6" ];
    SystemCallFilter = "~@clock @cpu-emulation @debug @module @mount @raw-io @reboot @swap";
    ProtectKernelTunables = true;
    ProtectKernelModules = true;
  };
}
```

```nix
{
  systemd.services.power-profiles-daemon.serviceConfig = {
    ProtectHome = true;
    ProtectClock = true;
    ProtectKernelTunables = true;
    ProtectKernelModules = true;
    ProtectKernelLogs = true;
    SystemCallFilter = "~@clock @cpu-emulation @debug @obsolete @module @mount @swap";
    ProtectControlGroups = true;
    RestrictNamespaces = true;
    LockPersonality = true;
    MemoryDenyWriteExecute = true;
    RestrictRealtime = true;
    RestrictSUIDSGID = true;
  };
}
```

This is based on the example I have shown above, and should serve as a good base
for _most_ services.

## Journal Hardening

It is no secret that Systemd services run with very lax permissions. One thing
that is less often talked about is the Systemd journal, Journald.

As the primary logging mechanism for systemd-based distributions, Journald
captures vast amounts of system and application data. However, this collection
of information also presents significant security risks if left unprotected.
This is why we must also take a look at hardening the system journal, which I
find is essential for maintaining system integrity, protecting sensitive data,
and ensuring compliance with security standards.

There are various methods through which Journald can leak sensitive information.
The threat model for the Journal may differ based on your distribution (i.e.,
different distributions ship different configurations for the system journal),
but as a general rule of thumb you should consider storing the system journal on
encrypted storage, with proper permissions (e.g., `640`) to protect it from
unauthorized inquiries. Additionally, if you have configured Journald to send
logs over the network, then then proper encryption is mandatory, or the data may
be intercepted during transmission. Do treat logfiles like toxic waste, and
handle them with care.

As a precaution, you might consider using volatile storage for the system
journal as such:

```nix
{
  services.journald = {
    storage = "volatile"; # Store logs in memory
    upload.enable = false; # Disable remote log upload (the default)
  };
}
```

`man 5 journald.conf` provides additional insight on options you may consider
setting through `services.journald.extraConfig`.

Last but not least, a dedicated enough attacker may attempt to run your system
out of resources by filling your journal (e.g., if service output is forwarded
to the journal) with bogus logs. In which case `SystemMaxUse` is a very useful
option to set.

## Conclusion

Remember that no amount of service hardening constitutes a bullet-proof security
layer. Also remember that those scores assigned by Systemd are arbitrary. A
service can be "safe" in the oblivious eyes of Systemd, but may risk security or
privacy in other ways. While hardening services, consider the needs and attack
vectors of each service that you are looking at.

## Resources

I am leaving here the resources I have consulted in the past. This post aims to
serve as a digestible summary of those resources as well as a guide to hardening
your system, but do feel free to consult them at any time. Most of them extend
beyond the scope of Systemd hardening, and will come up again in future posts.
Visit them at your own discretion, you are sure to learn something new.

- [`man 5 systemd.exec`](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html#Sandboxing)
- [Stackexchange on unprivileged userns clone](https://security.stackexchange.com/questions/209529/what-does-enabling-kernel-unprivileged-userns-clone-do)
- [Archwiki: Systemd Sandboxing by NetSysFire](https://wiki.archlinux.org/title/User:NetSysFire/systemd_sandboxing)
- [Madaidans Insecurities](https://madaidans-insecurities.github.io/)
  - [Madaidan's General Security Tips](https://madaidans-insecurities.github.io/security-privacy-advice.html)
- [Privsec on Desktop Linux hardening](https://privsec.dev/posts/linux/desktop-linux-hardening/)
- [Kicksecure Security](https://github.com/Kicksecure/security-misc)
  - [Kicksecure Hardened Kernel](https://www.kicksecure.com/wiki/Hardened-kernel)
- [Secureblue](https://github.com/secureblue/secureblue)
- [GrapheneOS Infrastructure](https://github.com/GrapheneOS/infrastructure)
- [NixOS Wiki on Systemd Hardening](https://wiki.nixos.org/wiki/Systemd/Hardening)
- [General tips on Systemd Hardening](https://github.com/alegrey91/systemd-service-hardening)
- [K4YT3X's Hardened & Optimized Linux Kernel Parameters](https://github.com/k4yt3x/sysctl/blob/master/sysctl.conf)
- [Notes on SSH Hardening](https://www.sshaudit.com/hardening_guides.html)
- [Hardened Profile module in Nixpkgs](https://github.com/NixOS/nixpkgs/blob/master/nixos/modules/profiles/hardened.nix)

**Security is a meaningless term without a threat model.**
