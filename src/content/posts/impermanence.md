---
title: "Full Disk Encryption and Impermanence on NixOS"
description: "Notes on setting up Impermanence with Full Disk Encryption on a NixOS system"
date: "2025-02-15"
keywords: ["nix", "nixos", "tutorial", "linux"]
---

# Impermanence on NixOS

Impermanence is an interesting concept. Aside from its philosophical aspect, it
has strange but pleasant implications on a NixOS system. Not only is it a
display of sheer flexibility of NixOS as an operating system, it also provides a
system that cleans itself up on each reboot. Gone are the days of manually
clearing useless state some programs have left behind.

This general setup concept utilizes NixOS' ability to boot off of a disk that
contains only `/nix` and `/boot`, linking appropriate devices and blocks during
the boot process and deleting all state that programs may have left over my
system. The end result, for me, was a fully encrypted that uses BTRFS snapshots
to restore `/` to its original state on each boot.

## Resources

This post is based on, and inspired by several resources. I tried to cover
everything you might need to set up a stateless NixOS system on your machines.

- [Impermanence repository](https://github.com/nix-community/impermanence)
- [This discourse post on Impermanence](https://discourse.nixos.org/t/impermanence-vs-systemd-initrd-w-tpm-unlocking/25167)
- [This blog post on setting up Impermanence](https://elis.nu/blog/2020/06/nixos-tmpfs-as-home)
- [This other blog post](https://guekka.github.io/nixos-server-1/)
- [And this post that the previous post is based on](https://mt-caret.github.io/blog/posts/2020-06-29-optin-state.html)

## Reproduction steps

I've had to go through a few guides before I could figure out a set up that I
really like. The final decision was that I would have an encrypted disk that
restores itself to its former state during boot. Is it fast? Absolutely not. But
it sure as hell is cool. And stateless!

To return the root (and only the root) we use a systemd service that fires
shortly after the disk is encrypted but before the root is actually mounted.
That way, we can unlock the disk, restore the disk to its pristine state using
the snapshot we have taken during installation and mount the root to go on with
our day.

### Partitioning

First you want to format your disk. If you are really comfortable with bringing
parted to your pre-formatted disks, by all means feel free to skip this section.
I, however, choose to format a fresh disk. It is also possible to switch to an
impermanent setup from your current installation, but you will be better off
starting from scratch. Remember to make a backup of important state!

Start by partitioning disks into several sections. For example: `sda1`, `sda2`
and `sda3`. This will differ if you are using nvme disks, for example,
`/dev/nvme0n1p1`.

```bash
# Set the disk name to make it easier
DISK=/dev/sdx # replace this with the name of the device you are using
```

Now set up the `boot` partition. This is where your bootloader will live. If you
intend to persist a lot of generations, you may want to allocate more space. For
example 2 GiB instead of just 1.

```bash
parted "$DISK" -- mklabel gpt
parted "$DISK" -- mkpart ESP fat32 1MiB 1GiB
parted "$DISK" -- set 1 boot on # assumes UEFI

mkfs.vfat -n BOOT "$DISK"1
```

Set up a swap partition You may choose to omit swap if your system has
sufficient RAM available. My machine has 16GB available, so I choose to allocate
8GBs for swap for my setup.

```bash
parted "$DISK" -- mkpart Swap linux-swap 1GiB 9GiB
mkswap -L SWAP "$DISK"2
swapon "$DISK"2
```

> I do in fact use swap in the civilized year of 2023[^1]. At the cost of
> disabling hibernation, I also choose to encrypt my swap. This guide will not
> cover how you may do so, but `swapDevices.*.randomEncryption` is a good start.

Encrypt your partition, and open it to make it available under
`/dev/mapper/enc`. `enc` will be your logical volume name, you may wish to give
it a different name.

```bash
cryptsetup --verify-passphrase -v luksFormat "$DISK"3 # /dev/sda3
cryptsetup open "$DISK"3 enc # the name enc is arbitrary, rename if you wish
```

Now partition the encrypted device block.

```bash
parted "$DISK" -- mkpart primary 9GiB 100%
mkfs.btrfs -L NIXOS /dev/mapper/enc
```

Mount the disk, and set up subvolumes. I use BTRFS for its flexibility and the
robustness. You may do something similar using ZFS, but I will not cover that
here.

```bash
mount -t btrfs /dev/mapper/enc /mnt

# First we create the subvolumes, those may differ as per your preferences
btrfs subvolume create /mnt/root
btrfs subvolume create /mnt/home
btrfs subvolume create /mnt/nix
btrfs subvolume create /mnt/persist # some people may choose to put /persist in /mnt/nix, I am not one of those people.
btrfs subvolume create /mnt/log
```

Now that we have created the BTRFS subvolumes, it is time for the _readonly_
snapshot of the root subvolume. This is what we will use to roll back our system
on each boot. Compared to `/` on tmpfs, rolling back manually on boot has the
added advantage of offering a way to restore unsaved data if your system shuts
down abruptly. For example if you suddenly loose power, you may boot into a
recovery system to recover anything that would be saved on `/`. This is an edge
case of course, but I prefer having the option.

```bash
btrfs subvolume snapshot -r /mnt/root /mnt/root-blank

# Make sure to unmount, otherwise nixos-rebuild will try to remove /mnt
# and fail
umount /mnt
```

### Mounting

After the subvolumes are created, we mount them with the options that we want.
Ideally, on NixOS, you want the `noatime`[^2] option and zstd compression,
especially on your `/nix` partition.

The following is my partition layout. If you have created any other subvolumes
in the step above, you will also want to mount them here. Below setup assumes
that you have been following the steps as is.

```bash
# /
mount -o subvol=root,compress=zstd,noatime /dev/mapper/enc /mnt

# /home
mkdir /mnt/home
mount -o subvol=home,compress=zstd,noatime /dev/mapper/enc /mnt/home

# /nix
mkdir /mnt/nix
mount -o subvol=nix,compress=zstd,noatime /dev/mapper/enc /mnt/nix

# /persist
mkdir /mnt/persist
mount -o subvol=persist,compress=zstd,noatime /dev/mapper/enc /mnt/persist

# /var/log
mkdir -p /mnt/var/log
mount -o subvol=log,compress=zstd,noatime /dev/mapper/enc /mnt/var/log

# Do not forget to mount the boot partition!
mkdir /mnt/boot
mount "$DISK"1 /mnt/boot
```

Now, finally, we create Nix generate the appropriate hardware configuration for
our setup.

```bash
nixos-generate-config --root /mnt
```

The generated configuration will be available at `/mnt/etc/nixos`.

Before we move on, we need to add the `neededForBoot = true;` to some mounted
subvolumes in `hardware-configuration.nix`. It will look something like this:

```nix
# Do not modify this file!  It was generated by ‘nixos-generate-config'
# and may be overwritten by future invocations.  Please make changes
# to /etc/nixos/configuration.nix instead.
{
  config,
  lib,
  pkgs,
  modulesPath,
  ...
}: {
  imports = [
    (modulesPath + "/installer/scan/not-detected.nix")
  ];

  boot.initrd.availableKernelModules = ["xhci_pci" "ahci" "usb_storage" "sd_mod" "rtsx_pci_sdmmc"];
  boot.initrd.kernelModules = [];
  boot.kernelModules = ["kvm-intel"];
  boot.extraModulePackages = [];

  fileSystems."/" = {
    device = "/dev/disk/by-uuid/b79d3c8b-d511-4d66-a5e0-641a75440ada";
    fsType = "btrfs";
    options = ["subvol=root"];
  };

  boot.initrd.luks.devices."enc".device = "/dev/disk/by-uuid/82144284-cf1d-4d65-9999-2e7cdc3c75d4";

  fileSystems."/home" = {
    device = "/dev/disk/by-uuid/b79d3c8b-d511-4d66-a5e0-641a75440ada";
    fsType = "btrfs";
    options = ["subvol=home"];
  };

  fileSystems."/nix" = {
    device = "/dev/disk/by-uuid/b79d3c8b-d511-4d66-a5e0-641a75440ada";
    fsType = "btrfs";
    options = ["subvol=nix"];
  };

  fileSystems."/persist" = {
    device = "/dev/disk/by-uuid/b79d3c8b-d511-4d66-a5e0-641a75440ada";
    fsType = "btrfs";
    options = ["subvol=persist"];
    neededForBoot = true; # <- add this
  };

  fileSystems."/var/log" = {
    device = "/dev/disk/by-uuid/b79d3c8b-d511-4d66-a5e0-641a75440ada";
    fsType = "btrfs";
    options = ["subvol=log"];
    neededForBoot = true; # <- add this
  };

  fileSystems."/boot" = {
    device = "/dev/disk/by-uuid/FDED-3BCF";
    fsType = "vfat";
  };

  swapDevices = [
    {device = "/dev/disk/by-uuid/0d1fc824-623b-4bb8-bf7b-63a3e657889d";}
    # if you encrypt your swap, it'll also need to be configured here
  ];

  nixpkgs.hostPlatform = lib.mkDefault "x86_64-linux";
  powerManagement.cpuFreqGovernor = lib.mkDefault "powersave";
}
```

Do keep in mind that the NixOS hardware scanner **cannot** pick up your mount
options. Which means that you should specify the options (i.e `noatime`) for
each BTRFS subvolume that you have created in `hardware-configuration.nix`. You
can simply add them in the `options = [ ]` list in quotation marks. I recommend
adding at least zstd compression, and optionally `noatime`.

### Installing

And that should be all. By this point you are pretty much ready to install with
your existing config. I generally use my configuration flake to boot, so there
is no need to make any revisions. If you are starting from scratch, you may
consider tweaking your configuration.nix before you install the system. An
editor, such as Neovim, or your preferred DE/wm make good additions to your
configuration.

Once it's all done, take a deep breath and `nixos-install`. Once the
installation is done, you'll be prompted for the root password and after that
you can reboot. Now you are running NixOS on an encrypted disk. Nice!

Next up, if you are feeling _really_ fancy today, is to configure disk erasure
and impermanence.

### Impermanence

To handle BTRFS snapshots and automatic rollbacks, I use a systemd service. This
requires systemd to be enabled in stage1. You may enable it with
`boot.initrd.systemd.enable = true;`. The schema for a systemd service in initrd
is the same as `systemd.services`, except `restartTriggers` and `reloadTriggers`
will not available.

```nix
{
  boot.initrd.systemd = {
    enable = true; # this enabled systemd support in stage1 - required for the below setup
    services.rollback = {
      description = "Rollback BTRFS root subvolume to a pristine state";
      wantedBy = ["initrd.target"];

      # LUKS/TPM process. If you have named your device mapper something other
      # than 'enc', then @enc will have a different name. Adjust accordingly.
      after = ["systemd-cryptsetup@enc.service"];

      # Before mounting the system root (/sysroot) during the early boot process
      before = ["sysroot.mount"];

      unitConfig.DefaultDependencies = "no";
      serviceConfig.Type = "oneshot";
      script = ''
        mkdir -p /mnt

        # We first mount the BTRFS root to /mnt
        # so we can manipulate btrfs subvolumes.
        mount -o subvol=/ /dev/mapper/enc /mnt

        # While we're tempted to just delete /root and create
        # a new snapshot from /root-blank, /root is already
        # populated at this point with a number of subvolumes,
        # which makes `btrfs subvolume delete` fail.
        # So, we remove them first.
        #
        # /root contains subvolumes:
        # - /root/var/lib/portables
        # - /root/var/lib/machines

        btrfs subvolume list -o /mnt/root |
          cut -f9 -d' ' |
          while read subvolume; do
            echo "deleting /$subvolume subvolume..."
            btrfs subvolume delete "/mnt/$subvolume"
          done &&
          echo "deleting /root subvolume..." &&
          btrfs subvolume delete /mnt/root
        echo "restoring blank /root subvolume..."
        btrfs subvolume snapshot /mnt/root-blank /mnt/root

        # Once we're done rolling back to a blank snapshot,
        # we can unmount /mnt and continue on the boot process.
        umount /mnt
      '';
    };
  };
}
```

> You may opt in for `boot.initrd.postDeviceCommands = lib.mkBefore ''` as
> [this blog post](https://mt-caret.github.io/blog/posts/2020-06-29-optin-state.html)
> suggests. I opt-in for a Systemd service as a servicee is a more powerful
> option of handling service dependencies. With postDeviceCommands, we would be
> sticking some bash code haphazardly in the stage-1 script, with a systemd
> service we will be holding granular control over the service ordedr.

### Implications & Workarounds

An impermanent setup has certain implications, for example, some files such as
saved networks for network-manager will be deleted on each reboot. While a
little clunky, [Impermanence](https://github.com/nix-community/impermanence) is
a great solution to our problem. Impermanence exposes to our system an
`environment.persistence."<dirName>"` option with its NixOS module, which we can
use to make certain directories or files permanent. My setup is as follows.

```nix
# inputs needs to be added to your 'specialArgs' in the lib.nixosSystem call.
# In some setups, individual inputs are passed to specialArgs directly and as
# such your setup may differ just a little bit. Note that if you are not using
# flakes, inputs will not be available at all. In which case, you must manually
# fetch impermanence with fetchTarball, or use the appropriate channel. I
# recommend using flakes since they offer a better UX overall.
{inputs, ...}: {
  imports = [inputs.impermanence.nixosModules.impermanence];

  environment.persistence."/persist" = {
    directories = [
      "/etc/nixos"
      "/etc/NetworkManager/system-connections"
      "/etc/secureboot"
      "/var/db/sudo"
    ];

    files = [
      "/etc/machine-id"

      # Required for SSH. If you have keys with different algorithms, then
      # you must also persist them here.
      "/etc/ssh/ssh_host_ed25519_key"
      "/etc/ssh/ssh_host_ed25519_key.pub"
      "/etc/ssh/ssh_host_rsa_key"
      "/etc/ssh/ssh_host_rsa_key.pub"
      # if you use docker or LXD, also persist their directories
    ];
  };
}
```

And that is pretty much it. If everything went well, you should now be telling
your friends about your new system boasting full disk encryption _and_ root
rollbacks. They, in turn, should be looking at you like cavemen. Arch users
could never. May they bask in their supreme glory.

## Closing Notes

As interesting as Impermanence is, it is also a little risky. The constant new
changes Nixpkgs receives on a daily basis might that a service may suddenly stop
using the state directory that you have configured it to use, and move to a
directory that you have not yet persisted. While running such a set up, you must
make sure to pay close attention to your system and back up everything
accordingly. Make sure to persist important directories, and have backups ready
in case something changes without your knowledge.

### Home Impermanence

Silly. `$HOME` is where state belongs. I will not cover this, and I do not
encourage that you make your home directory impermanent. If you insist on
setting it up, you may use a similar systemd service in `systemd.services` and
Impermanence's Home-Manager module.

### Why?

Honestly, why not?

Okay real answer. All imperative distributions suffer from something called
_configuration drift_. It is when your system constantly moving forward, through
updates and over time, leaving junk files that no longer have any use but still
remain on your disk. This is sometimes a security vulnerability, and sometimes
just general annoyance. Impermanence completely eliminates configuration drift,
and makes sure that your system is sparkly clean on each boot. Cool, right?

[^1]: I could be using `tmpfs` for `/` at this point in time. Unfortunately,
    since I share this setup on some of my low-end laptops, I've got no RAM to
    spare - which is exactly why I have opted out with BTRFS. It is a reliable
    filesystem that I am used to, and it allows for us to use a script that
    we'll see later on.

[^2]: Read about noatime
    [here](https://opensource.com/article/20/6/linux-noatime)
