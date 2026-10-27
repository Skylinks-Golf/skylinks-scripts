# Skylinks Mac Server Setup

Setup for Ian's always-on Mac mini: the Apple device for Apple-only work
(Reminders sync, Apple Developer / Xcode), plus cron jobs and Claude agents.

This is **not** the admin MacBook setup (`../new_mac_scripts/`). That one is
deliberately boring and leaves out dev tools. This one is a developer-run
server, so it installs a full shell environment and changes server settings.

## Run it

On a freshly installed Mac, signed in as the admin user, open Terminal:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Skylinks-Golf/skylinks-scripts/main/src/local/new_mac_server_scripts/bootstrap.sh)" bootstrap --hostname europa
```

`bootstrap.sh` downloads a tarball of this repo (no git needed yet) into
`~/Skylinks-Setup/server-snapshot` and runs `setup.sh` from it.

For branch testing, set the ref:

```bash
SKYLINKS_SETUP_REF=feature/mac-server-setup bash -c "$(curl -fsSL https://raw.githubusercontent.com/Skylinks-Golf/skylinks-scripts/feature/mac-server-setup/src/local/new_mac_server_scripts/bootstrap.sh)" bootstrap
```

## What setup.sh does

1. Checks the network and asks for the admin password once.
2. Installs Homebrew (which also installs the Xcode Command Line Tools).
3. Clones this repo to `~/data/skylinks/skylinks-scripts` over HTTPS.
4. Installs everything in the `Brewfile`. One failed package doesn't stop the run.
5. Installs Claude Code with its native installer, so it updates itself.
6. Symlinks the dotfiles from the clone into `~`. Existing files move to
   `~/.dotfiles-backup/<timestamp>/`, never deleted.
7. Server settings: no sleep, restart after power failure, firewall on,
   security updates automatic (major macOS upgrades manual), Remote Login on,
   computer name if `--hostname` was given.
8. Key-only SSH, but only once `~/.ssh/authorized_keys` exists.
9. Installs `tailscaled` as a system daemon, so Tailscale connects before login.
10. Reports auto-login and FileVault, then prints the manual steps.

Everything is logged to `~/Skylinks-Setup/server-setup-<timestamp>.log`.

## Options

| Option | What it does |
| --- | --- |
| `--hostname NAME` | Sets ComputerName, HostName and LocalHostName |
| `--dotfiles-only` | Only links the dotfiles. No sudo, safe on any Mac |
| `--dry-run` | Prints every change instead of making it |

Safe to re-run. Every step checks before it changes anything.

## Dotfiles

| File | Linked to | Purpose |
| --- | --- | --- |
| `dotfiles/shell/env.sh` | (sourced) | PATH, Homebrew, GNU tools first, editor |
| `dotfiles/shell/aliases.sh` | (sourced) | Aliases and functions for zsh and bash |
| `dotfiles/zsh/zshenv` | `~/.zshenv` | Env for non-interactive zsh (`ssh europa cmd`) |
| `dotfiles/zsh/zprofile` | `~/.zprofile` | Env for login zsh |
| `dotfiles/zsh/zshrc` | `~/.zshrc` | History, completion, keys, fzf, zoxide, Starship, plugins |
| `dotfiles/bash/bash_profile` | `~/.bash_profile` | Env for login bash |
| `dotfiles/bash/bashrc` | `~/.bashrc` | Interactive bash (works in stock 3.2 and brew's 5) |
| `dotfiles/starship.toml` | `~/.config/starship.toml` | Prompt: `user@host dir on branch`, no Nerd Font needed |
| `dotfiles/git/gitconfig` | `~/.gitconfig` | Git defaults |

**This repo is public.** Put anything private (git name and email, tokens,
host-specific aliases) in `~/.zshrc.local`, `~/.bashrc.local` or
`~/.gitconfig.local`. Those are sourced last and never tracked.

GNU coreutils, sed, grep, findutils and tar come first in `PATH`, so commands
behave like Linux. A script that needs the macOS version should call it by
full path (`/usr/bin/sed`).

Handy commands: `ll`, `lt` (tree), `z <dir>`, Ctrl+R (fzf history), `ips`,
`power`, `ports`, `ts` (Tailscale status), `sjobs` (Skylinks launchd jobs),
`joblog <name>`, `brewup`, `reload`.

## Files

| File | Purpose |
| --- | --- |
| `bootstrap.sh` | One-line entry point; downloads the repo and runs setup |
| `setup.sh` | Installer |
| `Brewfile` | Packages and apps |
| `dotfiles/` | Shell, prompt and git config |
| `post-install-checklist.md` | Manual steps after setup |
