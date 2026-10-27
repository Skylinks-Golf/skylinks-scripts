# Shared aliases and functions for zsh and bash.
#
# Keep this file valid in both shells. Shell-specific bits go in zshrc/bashrc.

# Listing
if command -v eza >/dev/null 2>&1; then
  alias ls='eza --group-directories-first'
  alias ll='eza -lh --git --group-directories-first'
  alias la='eza -lah --git --group-directories-first'
  alias lt='eza --tree --level=2 --group-directories-first'
else
  alias ll='ls -lh'
  alias la='ls -lah'
fi

alias grep='grep --color=auto'
alias ..='cd ..'
alias ...='cd ../..'

# Git
alias g='git'
alias gs='git status -sb'
alias gd='git diff'
alias gl='git log --oneline --graph --decorate -20'
alias gp='git pull'

# Shell
alias reload='exec "$SHELL" -l'
alias path='echo "$PATH" | tr ":" "\n"'

mkcd() {
  mkdir -p "$1" && cd "$1"
}

# Server
alias brewup='brew update && brew upgrade && brew cleanup'
alias ports='sudo lsof -iTCP -sTCP:LISTEN -n -P'
alias power='pmset -g | grep -E "^ (sleep|disksleep|displaysleep|autorestart|womp) "'
alias flushdns='sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder'
alias ts='tailscale status'
alias logs='cd "$SKYLINKS_LOG_DIR"'
alias sjobs='launchctl list | grep -i skylinks'

# LAN and Tailscale addresses
ips() {
  echo "LAN:       $(ipconfig getifaddr en0 2>/dev/null || echo none)"
  if command -v tailscale >/dev/null 2>&1; then
    echo "Tailscale: $(tailscale ip -4 2>/dev/null || echo 'not connected')"
  fi
}

# Follow a scheduled job's log: joblog reminders-sync
joblog() {
  tail -n 50 -f "$SKYLINKS_LOG_DIR/$1.log"
}
