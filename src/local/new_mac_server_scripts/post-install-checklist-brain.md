# Skylinks Brain Server — Post-Install Checklist

Work through this at the Mac (or over Screen Sharing) after
`setup.sh --role brain --site <site>`. Same shape as `post-install-checklist.md`,
minus the Apple-only steps (iCloud, Reminders, App Store, Xcode).

## Remote access

- [ ] `sudo tailscale up` and approve the machine in the Tailscale admin console
- [ ] The machine shows up as `<site>-brain` on the tailnet
- [ ] Screen Sharing on: System Settings > General > Sharing
- [ ] Remote Login on (if setup.sh warned it couldn't do it)
- [ ] Laptop's public key added to `~/.ssh/authorized_keys`, then re-run
      `setup.sh` (same flags) to switch SSH to key-only
- [ ] SSH works from the laptop over Tailscale
- [ ] VNC works from the laptop over Tailscale

## Always-on

- [ ] Auto-login set to this user: System Settings > Users & Groups
- [ ] FileVault off (auto-login needs it off)
- [ ] DHCP reservation for this Mac on the site router
- [ ] Restart test: reboot, then confirm SSH and Tailscale come back unattended
- [ ] UPS, if available

## Accounts

- [ ] `op account add`, then confirm `op` can read the Claude admin logins
- [ ] `claude` signed in
- [ ] `gh auth login`
- [ ] `gcloud auth login`
- [ ] `~/.gitconfig.local` with git name and email

## Layout

- [ ] `~/skylinks/site.env` has the right `SKYLINKS_SITE`
- [ ] `~/skylinks/data` and `~/skylinks/backups` exist
- [ ] `~/Library/Logs/skylinks` exists

## Final validation

- [ ] New terminal tab shows the Starship prompt with `user@host`
- [ ] `ips`, `ts`, `power` show the expected values
- [ ] `brew doctor` is clean
