#!/usr/bin/env bash
#
# Skylinks Mac Server Bootstrap
#
# Downloads a snapshot of skylinks-scripts and hands off to setup.sh. Uses the
# GitHub tarball rather than git, so it works on a fresh Mac before the Xcode
# Command Line Tools (and therefore git) exist.
#
# Run it with:
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/Skylinks-Golf/skylinks-scripts/main/src/local/new_mac_server_scripts/bootstrap.sh)"
#
# Pass setup.sh options after a placeholder $0, e.g.:
#   bash -c "$(curl -fsSL <url>)" bootstrap --hostname europa
#
# Note the $(...) form rather than a pipe: it keeps stdin attached to the
# terminal so setup.sh can prompt for the admin password.
#
# Override the ref for branch testing:
#   SKYLINKS_SETUP_REF=feature/mac-server-setup bash -c "$(curl ...)"

set -euo pipefail

SKYLINKS_SETUP_REF="${SKYLINKS_SETUP_REF:-main}"

TARBALL_URL="https://codeload.github.com/Skylinks-Golf/skylinks-scripts/tar.gz/$SKYLINKS_SETUP_REF"
SETUP_DIR="$HOME/Skylinks-Setup"
SNAPSHOT_DIR="$SETUP_DIR/server-snapshot"

echo "Skylinks Mac server bootstrap"
echo "Source ref: $SKYLINKS_SETUP_REF"
echo

mkdir -p "$SETUP_DIR"

# A fresh snapshot each run, so a re-run never mixes files from two refs.
rm -rf "$SNAPSHOT_DIR"
mkdir -p "$SNAPSHOT_DIR"

echo "Downloading skylinks-scripts..."
curl -fsSL --max-time 120 "$TARBALL_URL" | tar -xz --strip-components=1 -C "$SNAPSHOT_DIR"

SETUP_SH="$SNAPSHOT_DIR/src/local/new_mac_server_scripts/setup.sh"
if [[ ! -f "$SETUP_SH" ]]; then
  echo "ERROR: setup.sh not found in the snapshot for ref '$SKYLINKS_SETUP_REF'."
  exit 1
fi
chmod +x "$SETUP_SH"

echo "Starting setup..."
echo
export SKYLINKS_SETUP_REF
exec "$SETUP_SH" "$@"
