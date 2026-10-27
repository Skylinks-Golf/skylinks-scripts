# Shared environment for zsh and bash.
#
# POSIX sh syntax so both shells can source it. Loaded by login shells and by
# non-interactive zsh (ssh europa <command>), see zsh/zshenv.

# Homebrew
if [ -x /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -x /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# GNU tools ahead of the BSD ones, so ls/sed/grep/find/tar behave like Linux.
# Scripts that need the macOS versions should call /usr/bin/sed etc. directly.
if [ -n "${HOMEBREW_PREFIX:-}" ]; then
  for _pkg in coreutils gnu-sed grep findutils gnu-tar; do
    _gnubin="$HOMEBREW_PREFIX/opt/$_pkg/libexec/gnubin"
    if [ -d "$_gnubin" ]; then
      PATH="$_gnubin:$PATH"
    fi
  done
  unset _pkg _gnubin
fi

# User tools (Claude Code's native installer lives here)
PATH="$HOME/.local/bin:$PATH"
export PATH

export LANG="${LANG:-en_US.UTF-8}"
export EDITOR="${EDITOR:-vim}"
export PAGER="${PAGER:-less}"
export LESS="-R -F"

export HOMEBREW_NO_ANALYTICS=1
export HOMEBREW_NO_ENV_HINTS=1

# Where scheduled jobs (launchd) write their logs
export SKYLINKS_LOG_DIR="$HOME/Library/Logs/skylinks"
