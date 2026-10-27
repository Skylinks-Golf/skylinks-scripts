# Skylinks Mac Server — Post-Install Checklist

Work through this at the Mac (or over Screen Sharing) after `setup.sh`.

## Remote access

- [ ] `sudo tailscale up` and approve the machine in the Tailscale admin console
- [ ] Screen Sharing on: System Settings > General > Sharing
- [ ] Remote Login on (if setup.sh warned it couldn't do it)
- [ ] Laptop's public key added to `~/.ssh/authorized_keys`, then re-run
      `setup.sh` to switch SSH to key-only
- [ ] SSH works from the Windows laptop over Tailscale
- [ ] VNC works from the Windows laptop over Tailscale

## Always-on

- [ ] Auto-login set to this user: System Settings > Users & Groups
- [ ] FileVault off (auto-login needs it off)
- [ ] DHCP reservation for this Mac on the office router
- [ ] Restart test: reboot, then confirm SSH and Tailscale come back unattended
- [ ] UPS, if available

## Accounts

- [ ] iCloud signed in, Reminders on
- [ ] App Store signed in, then re-run `setup.sh` to install Xcode
- [ ] `claude` signed in
- [ ] `gh auth login`
- [ ] `gcloud auth login`
- [ ] `~/.gitconfig.local` with git name and email
- [ ] SSH key for GitHub, and the repo remote switched to SSH if pushing from here

## Permissions (first run of each job triggers the prompt)

- [ ] Reminders access for the Reminders sync job
- [ ] Full Disk Access for the terminal, if a job needs it

## Final validation

- [ ] New terminal tab shows the Starship prompt with `user@host`
- [ ] `ips`, `ts`, `power` show the expected values
- [ ] `brew doctor` is clean
