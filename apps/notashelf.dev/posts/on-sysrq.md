---
title: "On SysRq"
description: "Understanding, using or disabling SysRq as per your needs"
date: 2024-05-11
archived: true
---

## Resources

- https://wiki.archlinux.org/title/keyboard_shortcuts
- https://en.wikipedia.org/wiki/Magic_SysRq_key
- https://docs.kernel.org/admin-guide/sysrq.html
- https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/Documentation/admin-guide/sysrq.rst

## What is SysRq?

SysRq is a "_magical_"[^1] key combination, or possibly a literal key on your
keyboard that is understood by the Linux kernel, which allows you to perform
various low-level commands regardless of the system's current state. Some
Linux-first computer manufacturers may include a literal SysRq key, or chances
are your PrtSc key (located somewhat close to your Numpad) doubles as it.

## What can I do with it?

SysRq is most often used to recover from and debug an unresponsive system,
especially if you are trying to avoid doing a hard shutdown - which could
potentially cause data corruption - and is recommended over a hard shutdown.
Using the SysRq key, you can communicate with the Linux kernel directly and
reboot your _correctly_, without potentially nuking active disk writes.

## How do I use SysRq?

You should first check if your system is configured to support SysRq. Some
distros and users (such as myself) decide to disable SysRq because it is a
potential security flaw.

To check whether your system is allowed to use SysRq, simply run

```bash
cat /proc/sys/kernel/sysrq
```

and you will receive a value that describes the functionality of your SysRq key,
or whether or not it is allowed.

### Possible Values

The [kernel documentation](https://docs.kernel.org/admin-guide/sysrq.html) gives
you a neat list of values and what they allow.

| Value | Bitmask | Description                                           |
| ----- | ------- | ----------------------------------------------------- |
| 0     | 0x0     | disable sysrq completely                              |
| 1     | 0x1     | enable all functions of sysrq                         |
| 2     | 0x2     | enable control of console logging level               |
| 4     | 0x4     | enable control of keyboard (SAK, unraw)               |
| 8     | 0x8     | enable debugging dumps of processes etc               |
| 16    | 0x10    | enable sync command                                   |
| 32    | 0x20    | enable remount read-only                              |
| 64    | 0x40    | enable signalling of processes (term, kill, oom-kill) |
| 128   | 0x80    | allow reboot/poweroff                                 |
| 256   | 0x100   | allow nicing of all RT tasks                          |

### Setting SysRq Bitmask

You can set SysRq to `0` in order to disable it, `1` to allow ALL functionality
and to a value `>= 1` to set a bitmask[^2] of allowed SysRq functions.

```bash
echo "number" >/proc/sys/kernel/sysrq
```

To combine different functionalities in the SysRq permission bitmap, you will
need to perform bitwise OR operations on the values corresponding to the
functionalities you want to enable. Each functionality corresponds to a specific
bit in the bitmap.

E.g., let's say you want to enable the functionalities for controlling console
logging level `(0x2)`, enabling sync command `(0x10)`, and allowing
reboot/poweroff `(0x80)`. To combine these functionalities:

```
0x2 (console logging level) | 0x10 (sync command) | 0x80 (reboot/poweroff)
```

Which would perform the following bitwise OR operation:

```
0x2 | 0x10 | 0x80 = 0x92
```

This **hexadecimal** value would then be converted to **decimal** (which the
kernel commandline expects) as `146.` Therefore you would run the following
command to set your desired bitmask:

```bash
echo 146 > /proc/sys/kernel/sysrq
```

### Persisting SysRq

You can enable `SysRq` with one command, as described above. Do keep in mind
that running e.g. `echo 1 > /proc/sys/kernel/sysrq` will enable SysRq only until
reboot and its state will not persist across reboots.

On traditional distros, you can make it persistent by adding
`"kernel.sysrq = 1"` at the end of `/etc/sysctl.d/99-sysctl.conf`.

On NixOS, you will need to set `boot.kernel.sysctl."kernel.sysrq" = 1;` in your
`configuration.nix`. In some cases, you might need to _force_ this value in case
it is being overridden:

```nix
boot.kernel.sysctl."kernel.sysrq" = lib.mkForce 1;
```

## Useful applications of SysRq

There are various applications of SysRq based on the bitmask range it was
allowed. Below are the two most common ones that I came across.

### Rebooting with SysRq

Earlier I have mentioned that SysRq is often used to perform a proper reboot and
to recover a frozen system. With a permissive enough[^3] bitmask, you can use
the following idiom: "Reboot Even If System Utterly Broken" (also referred to as
"REISUB").

- R: Turns off keyboard raw mode, and sets it to XLATE.
- E: Send a SIGTERM to all processes, except for init.
- I: Send a SIGKILL to all processes, except for init.
- S: Will attempt to sync all mounted filesystems.
- U: Will attempt to re-mount all mounted filesystems as read-only.
- B: Reboot!

> Please be aware that "REISUB" itself is just a mnemonic, not any kind of
> general recommendation for the key press sequence to take back control of an
> unresponsive system. You should not blindly press these sequences each time
> without knowing their actual function as noted below[^4]

To do this on your system, you what you need to do is to hold down the `ALT` key
and the `SysRq` keys at the same time, hit the next queued letter while holding
the key combination, and then release. Repeat this for each letter (command) in
the idiom. To summarize, running the `REISUB` sequence would require you to hold
down `ALT + SysRq` 6 **separate** times

### Invoking OOM Killer

SysRq can also be used to invoke the OOM (out-of-memory) killer without causing
a kernel panic if there is nothing to kill. If your system is frozen due to
intense memory pressure, this could be an useful way to quickly get yourself out
of a status that might corrupt your data. Simply run `ALT + SysRq + f` and hope
that OOM killer picks something recoverable.

> Keep in mind that the OOM killer, despite its well-meaning heuristics, can be
> unpredictable and lead to irreversible damage. Do not use this key combination
> casually.

## Is SysRq worth it?

Those who have gone through my system configuration might have noticed that I
force SysRq to be disabled with `kernel.sysrq` set to `0`.

That is because I never had the need to use SysRq. After years on Linux, I never
had to recover from a system freezing over a long duration. It either lives, or
it dies. Recently I have configured OOM killer daemon to automatically kill
useless applications such as Electron, that tend to drain my memory - especially
on low-end systems because despite what devs might say, **electron still
sucks**. As such, I do not think that SysRq is worth the potential security flaw
right, but that question is for you to answer yourself.

[^1]: Quite literally what it is called in the
    [kernel documentation](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/Documentation/admin-guide/sysrq.rst)

[^2]: The permission bitmap is a 32-bit bitmap that determines which SysRq
    commands are allowed to be executed. Each bit in the bitmap corresponds to a
    specific SysRq command. When a SysRq command is issued, the kernel checks
    the corresponding bit in the permission bitmap to determine whether the
    command is allowed or not.

[^3]: The whole set of `REISUB` functions can be enabled by setting SysRq value
    to 244, although this will also enable additional functions which some may
    find undesirable. If in doubt, do the math and choose your bitmask range
    yourself.

[^4]: [Archwiki on SysRq](https://wiki.archlinux.org/title/keyboard_shortcuts#Rebooting)
