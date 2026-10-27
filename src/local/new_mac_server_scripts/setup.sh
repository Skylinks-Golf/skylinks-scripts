#!/usr/bin/env bash
#
# Skylinks Mac Server Setup
#
# Turns a freshly installed Mac into Ian's always-on work server: Homebrew and
# the Brewfile, shell dotfiles, Claude Code, and server power/remote settings.
# Run it at the machine (or over Screen Sharing): it prompts for the admin
# password and some steps trigger macOS permission dialogs.
#
# Safe to re-run. Every step checks before it changes anything.
#
# Usage:
#   ./setup.sh                    full setup
#   ./setup.sh --hostname europa  also set the computer name
#   ./setup.sh --dotfiles-only    only link the shell dotfiles (no sudo)
#   ./setup.sh --dry-run          print what would happen, change nothing
#
# Written for macOS's stock bash 3.2 — do not use bash 4+ syntax here.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_REL_DIR="src/local/new_mac_server_scripts"
REPO_URL="https://github.com/Skylinks-Golf/skylinks-scripts.git"
REPO_DIR="${SKYLINKS_REPO_DIR:-$HOME/data/skylinks/skylinks-scripts}"
SKYLINKS_SETUP_REF="${SKYLINKS_SETUP_REF:-main}"

SETUP_DIR="$HOME/Skylinks-Setup"
DOTFILES_DIR="$SCRIPT_DIR/dotfiles"
BACKUP_DIR="$HOME/.dotfiles-backup/$(date +%Y%m%d-%H%M%S)"
JOB_LOG_DIR="$HOME/Library/Logs/skylinks"

DRY_RUN=0
DOTFILES_ONLY=0
NEW_HOSTNAME=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)       DRY_RUN=1 ;;
    --dotfiles-only) DOTFILES_ONLY=1 ;;
    --hostname)
      NEW_HOSTNAME="${2:-}"
      if [[ -z "$NEW_HOSTNAME" ]]; then
        echo "ERROR: --hostname needs a name, e.g. --hostname europa"
        exit 1
      fi
      shift
      ;;
    -h|--help)
      sed -n '3,19p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "ERROR: unknown option: $1 (try --help)"
      exit 1
      ;;
  esac
  shift
done

mkdir -p "$SETUP_DIR"
LOG="$SETUP_DIR/server-setup-$(date +%Y%m%d-%H%M%S).log"

# Mirror everything to a log so a failure is diagnosable later.
exec > >(tee -a "$LOG") 2>&1

# Tracks non-fatal problems so the run always reaches the checklist.
WARNINGS=0

# Run a command, or just print it in --dry-run mode.
run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf 'DRY-RUN:'
    printf ' %q' "$@"
    printf '\n'
  else
    "$@"
  fi
}

warn() {
  WARNINGS=$((WARNINGS + 1))
  echo "WARNING: $*"
}

section() {
  echo
  echo "======================================"
  echo " $*"
  echo "======================================"
  echo
}

# ---------------------------------------------------------------------------
# Dotfiles
#
# Each file is symlinked from the repo so `git pull` updates the shell config.
# Anything already in the way is moved to ~/.dotfiles-backup/<timestamp>/,
# never deleted.
# ---------------------------------------------------------------------------

link_dotfile() {
  local src="$DOTFILES_DIR/$1"
  local dest="$HOME/$2"

  if [[ ! -e "$src" ]]; then
    warn "missing in repo: $src"
    return 0
  fi

  if [[ -L "$dest" ]] && [[ "$(readlink "$dest")" == "$src" ]]; then
    echo "[ OK    ] ~/$2"
    return 0
  fi

  if [[ -e "$dest" ]] || [[ -L "$dest" ]]; then
    run mkdir -p "$BACKUP_DIR/$(dirname "$2")"
    run mv "$dest" "$BACKUP_DIR/$2"
    echo "[ BACKUP] ~/$2 -> $BACKUP_DIR/$2"
  fi

  run mkdir -p "$(dirname "$dest")"
  run ln -s "$src" "$dest"
  echo "[ LINKED] ~/$2"
}

link_dotfiles() {
  section "Shell dotfiles"
  echo "Linking from: $DOTFILES_DIR"
  echo

  link_dotfile "zsh/zshenv"         ".zshenv"
  link_dotfile "zsh/zprofile"       ".zprofile"
  link_dotfile "zsh/zshrc"          ".zshrc"
  link_dotfile "bash/bash_profile"  ".bash_profile"
  link_dotfile "bash/bashrc"        ".bashrc"
  link_dotfile "starship.toml"      ".config/starship.toml"
  link_dotfile "git/gitconfig"      ".gitconfig"

  echo
  echo "Machine-specific or private settings go in these untracked files:"
  echo "  ~/.zshrc.local  ~/.bashrc.local  ~/.gitconfig.local"
}

if [[ "$DOTFILES_ONLY" -eq 1 ]]; then
  link_dotfiles
  echo
  echo "Done. Open a new terminal tab to load the new shell config."
  exit 0
fi

echo "======================================"
echo " Skylinks Mac Server Setup"
echo "======================================"
echo
echo "Source ref:  $SKYLINKS_SETUP_REF"
echo "Repo clone:  $REPO_DIR"
echo "Log file:    $LOG"
[[ "$DRY_RUN" -eq 1 ]] && echo "Mode:        DRY RUN (nothing will change)"

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------

section "Preflight"

echo "Checking network access..."
if ! curl -fsSL --head --max-time 15 https://brew.sh >/dev/null 2>&1; then
  echo "ERROR: Could not reach brew.sh. Check the network, then re-run."
  exit 1
fi
echo "Network check passed."
echo

if [[ "$DRY_RUN" -eq 0 ]]; then
  # Ask for the admin password now, at a predictable moment, rather than
  # several minutes into the run buried in Homebrew output.
  echo "This setup needs the Mac admin password."
  echo "Enter it at the prompt below (nothing is stored or transmitted)."
  echo
  sudo -v

  # Keep the sudo timestamp warm so the prompt does not reappear mid-install.
  while true; do
    sudo -n true 2>/dev/null || exit
    sleep 60
    kill -0 "$$" 2>/dev/null || exit
  done &
  SUDO_KEEPALIVE_PID=$!
  trap 'kill "$SUDO_KEEPALIVE_PID" 2>/dev/null || true' EXIT
  echo "Admin access confirmed."
fi

# ---------------------------------------------------------------------------
# Homebrew
#
# The Homebrew installer takes care of the Xcode Command Line Tools itself,
# so there is deliberately no separate xcode-select step here.
# ---------------------------------------------------------------------------

section "Homebrew"

if [[ -x /opt/homebrew/bin/brew ]] || [[ -x /usr/local/bin/brew ]]; then
  echo "Homebrew already installed."
else
  echo "Installing Homebrew (also installs the Xcode Command Line Tools)..."
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY-RUN: Homebrew install.sh"
  else
    NONINTERACTIVE=1 /bin/bash -c \
      "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
fi

BREW_BIN=""
if [[ -x /opt/homebrew/bin/brew ]]; then
  BREW_BIN="/opt/homebrew/bin/brew"
elif [[ -x /usr/local/bin/brew ]]; then
  BREW_BIN="/usr/local/bin/brew"
fi

if [[ -n "$BREW_BIN" ]]; then
  eval "$("$BREW_BIN" shellenv)"
  brew --version | head -1
elif [[ "$DRY_RUN" -eq 0 ]]; then
  echo "ERROR: Homebrew install finished, but the brew binary was not found."
  exit 1
fi

# ---------------------------------------------------------------------------
# Repo clone
#
# The dotfiles are symlinked into $HOME, so they need a permanent home. The
# bootstrap snapshot is replaced on every run, so clone the repo properly.
# HTTPS works without keys because the repo is public; switch the remote to
# SSH later if you want to push from this machine.
# ---------------------------------------------------------------------------

section "skylinks-scripts clone"

if [[ -d "$REPO_DIR/.git" ]]; then
  echo "Already cloned: $REPO_DIR (branch: $(git -C "$REPO_DIR" branch --show-current 2>/dev/null || echo unknown))"
else
  run mkdir -p "$(dirname "$REPO_DIR")"
  run git clone --branch "$SKYLINKS_SETUP_REF" "$REPO_URL" "$REPO_DIR"
fi

if [[ -d "$REPO_DIR/$REPO_REL_DIR/dotfiles" ]]; then
  DOTFILES_DIR="$REPO_DIR/$REPO_REL_DIR/dotfiles"
fi
BREWFILE="$SCRIPT_DIR/Brewfile"

# ---------------------------------------------------------------------------
# Packages
# ---------------------------------------------------------------------------

section "Packages (Brewfile)"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "DRY-RUN: brew bundle --file=$BREWFILE"
  grep -E '^(brew|cask|mas|tap) ' "$BREWFILE" | sed 's/^/  /'
elif brew bundle --file="$BREWFILE"; then
  echo
  echo "All packages installed."
else
  # Never let one failed package abort the run. A missing App Store sign-in
  # makes the Xcode line fail, which is expected on a first run.
  warn "one or more packages failed to install. Details are in the log."
fi

# ---------------------------------------------------------------------------
# Claude Code
#
# Native installer rather than the Homebrew cask: it keeps itself updated,
# which matters on a machine nobody sits at.
# ---------------------------------------------------------------------------

section "Claude Code"

if command -v claude >/dev/null 2>&1 || [[ -x "$HOME/.local/bin/claude" ]]; then
  echo "Claude Code already installed."
elif [[ "$DRY_RUN" -eq 1 ]]; then
  echo "DRY-RUN: curl -fsSL https://claude.ai/install.sh | bash"
else
  curl -fsSL https://claude.ai/install.sh | bash || warn "Claude Code install failed."
fi

link_dotfiles

run mkdir -p "$JOB_LOG_DIR"

# ---------------------------------------------------------------------------
# Server settings
#
# Unlike the admin MacBook setup, this script changes these settings: an
# unattended server that sleeps or stays off after a power cut is useless.
# ---------------------------------------------------------------------------

section "Server settings"

echo "Power: never sleep, restart after power failure, wake for network."
run sudo pmset -a sleep 0 disksleep 0 displaysleep 10 autorestart 1 womp 1

echo "Firewall: on."
run sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on

echo "Software updates: check, download, and install security updates."
echo "(Major macOS upgrades stay manual so the server never reboots into one.)"
for KEY in AutomaticCheckEnabled AutomaticDownload CriticalUpdateInstall ConfigDataInstall; do
  run sudo defaults write /Library/Preferences/com.apple.SoftwareUpdate "$KEY" -bool true
done
run sudo defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticallyInstallMacOSUpdates -bool false

if [[ -n "$NEW_HOSTNAME" ]]; then
  echo "Computer name: $NEW_HOSTNAME"
  run sudo scutil --set ComputerName "$NEW_HOSTNAME"
  run sudo scutil --set HostName "$NEW_HOSTNAME"
  run sudo scutil --set LocalHostName "$NEW_HOSTNAME"
fi

echo "Remote Login (SSH): on."
if ! run sudo systemsetup -setremotelogin on; then
  warn "could not turn on Remote Login from the script (macOS wants Full Disk"
  echo "         Access for the terminal). Turn it on by hand:"
  echo "         System Settings > General > Sharing > Remote Login"
fi

# Key-only SSH, but only once a key is in place, so this can never lock the
# only admin out.
SSHD_DROPIN="/etc/ssh/sshd_config.d/100-skylinks.conf"
if [[ -s "$HOME/.ssh/authorized_keys" ]]; then
  if [[ -f "$SSHD_DROPIN" ]]; then
    echo "SSH: key-only login already configured."
  else
    echo "SSH: key-only login (authorized_keys found)."
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "DRY-RUN: write $SSHD_DROPIN"
    else
      printf '%s\n' \
        "# Added by skylinks-scripts new_mac_server_scripts/setup.sh" \
        "PasswordAuthentication no" \
        "KbdInteractiveAuthentication no" \
        "PermitRootLogin no" | sudo tee "$SSHD_DROPIN" >/dev/null
    fi
  fi
else
  echo "SSH: password login left on. Add your key to ~/.ssh/authorized_keys"
  echo "     and re-run to switch to key-only."
fi

if command -v tailscaled >/dev/null 2>&1; then
  if sudo -n launchctl print system/com.tailscale.tailscaled >/dev/null 2>&1; then
    echo "Tailscale: system daemon already installed."
  else
    echo "Tailscale: installing the system daemon (runs before login)."
    run sudo tailscaled install-system-daemon || warn "tailscaled install-system-daemon failed."
  fi
else
  echo "Tailscale: tailscaled not found, skipping."
fi

# ---------------------------------------------------------------------------
# Status report (read-only)
# ---------------------------------------------------------------------------

section "Status"

AUTO_LOGIN="$(defaults read /Library/Preferences/com.apple.loginwindow autoLoginUser 2>/dev/null || true)"
if [[ "$AUTO_LOGIN" == "$(id -un)" ]]; then
  echo "[ OK    ] Auto-login is set to $AUTO_LOGIN."
else
  echo "[ ACTION] Auto-login is not set to $(id -un)."
  echo "          The server needs it so Reminders, the keychain and agents"
  echo "          come back after a restart:"
  echo "          System Settings > Users & Groups > Automatically log in as"
fi

if fdesetup status 2>/dev/null | grep -q "FileVault is On"; then
  echo "[ CHECK ] FileVault is on. Auto-login won't work while it is."
else
  echo "[ INFO  ] FileVault is off (expected for this server)."
fi

echo "[ INFO  ] Power: $(pmset -g | awk '$1=="sleep"||$1=="autorestart"{printf "%s=%s ", $1, $2}')"
echo "[ INFO  ] Computer name: $(scutil --get ComputerName 2>/dev/null || echo unknown)"

# ---------------------------------------------------------------------------
# Manual steps
# ---------------------------------------------------------------------------

section "$( [[ "$WARNINGS" -gt 0 ]] && echo "Setup finished with $WARNINGS warning(s)" || echo "Setup complete" )"

echo "Manual next steps (see post-install-checklist.md):"
echo
echo "1. sudo tailscale up            # sign this Mac into the tailnet"
echo "2. Turn on Screen Sharing:      System Settings > General > Sharing"
echo "3. Turn on auto-login (see Status above)."
echo "4. Sign in to iCloud with Reminders on."
echo "5. Sign in to the App Store, then re-run to install Xcode."
echo "6. claude                       # sign in to Claude Code"
echo "7. gh auth login && gcloud auth login"
echo "8. Open a new terminal tab to load the new shell config."
echo
echo "Logs: $LOG"

if [[ "$WARNINGS" -gt 0 ]]; then
  exit 1
fi
