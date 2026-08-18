# Skylinks Admin Windows Setup

Boring, stable setup workflow for location-level Skylinks admin/manager
Windows laptops. The Windows counterpart to `../new_mac_scripts/`.

> Not to be confused with `../new_pc_scripts/`, which provisions the
> **registers** (POS/kiosk machines) and is a separate flow.

## Philosophy

Simple and solid.

This is not MDM. This is not account provisioning. This is not a developer
laptop bootstrap. It removes bloatware, installs the baseline apps expected on
a standard Skylinks admin laptop, then hands off to a human checklist.

## What it installs

- Google Chrome
- Google Drive
- Notion
- Slack
- Zoom
- Claude Desktop
- PowerShell 7 (Windows extra — macOS ships a modern shell, Windows does not)

## What it intentionally does not install

- Microsoft Office
- Quality-of-life apps
- Developer tools (beyond PowerShell 7)
- Password managers
- Role-specific software

Microsoft Office is excluded because it is only for select company-level staff.
Location-based admins and managers do not need it by default.

## Setup method

Normal path is a Flipper Zero BadUSB payload that opens the Run dialog and
types a single self-elevating line. The operator stays with the laptop for the
whole run.

Without a Flipper, open an **elevated** PowerShell (right-click > Run as
administrator) and run:

```powershell
iex (irm https://raw.githubusercontent.com/Skylinks-Golf/skylinks-scripts/main/src/local/new_win_scripts/bootstrap.ps1)
```

`bootstrap.ps1` creates `%USERPROFILE%\Skylinks-Setup`, downloads `setup.ps1`
and `packages.txt` into it, and runs `setup.ps1`.

## Elevation

The Flipper payload runs, via the Run dialog:

```
powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoExit','-Command','iex (irm <bootstrap-url>)'"
```

A normal PowerShell launches and immediately re-launches itself elevated. This
triggers a **UAC prompt** — the Windows equivalent of the Mac's `sudo` prompt.
The operator clicks **Yes**. Because the elevated window runs the bootstrap on
its own, there is no keystroke timing tied to the UAC dialog.

## What setup.ps1 does

1. Verifies it is running as Administrator (exits if not).
2. Resolves winget (the `brew` analogue).
3. **Aggressively removes bloatware** — Microsoft consumer apps (Xbox, Bing,
   Solitaire, Skype, consumer Teams, etc.), OEM-preloaded junk (Spotify,
   TikTok, games, streaming, social), and OneDrive. All reversible from the
   Microsoft Store.
4. Installs the baseline apps from `packages.txt` via winget.
5. Applies light optimization: minimum telemetry, removes Cortana.
6. Opens Chrome so it can offer to become the default browser.
7. Reports BitLocker, Windows Update, sign-in-on-wakeup, and computer name.
8. Prints the manual sign-in and permission steps.

Everything is logged to `%USERPROFILE%\Skylinks-Setup\setup-<timestamp>.log`.

A failed app install does not abort the run. The script warns, finishes, prints
the checklist, and exits non-zero.

## What it deliberately does NOT do

- **No power-setting changes.** The register script forces never-sleep on AC;
  that is wrong for a laptop (battery + security), so laptop power is left at
  Windows defaults.
- **No security changes.** BitLocker, Windows Update, and lock-on-wake are
  reported but never changed — BitLocker in particular involves recovery keys
  and must be a human step. See `post-install-checklist.md`.

## Editions note

The telemetry policy is fully effective on Windows Pro/Enterprise and only
partially on Home. Bloatware removal works on all editions.

## Re-running

Safe to re-run. winget skips anything already installed, and bloatware removal
is idempotent.

## Pinning the ref

`bootstrap.ps1` fetches from `SKYLINKS_SETUP_REF`, which defaults to `main`.
This repo is public, so whatever `main` points at is what gets installed on
admin laptops. Before rollout, cut an immutable tag and use it in both places
in the same commit:

1. Set `$Ref` in `bootstrap.ps1` to the tag.
2. Update the URL in the Flipper payload to the same tag.

For branch testing, override inline:

```powershell
$env:SKYLINKS_SETUP_REF = 'feature/xyz'
iex (irm https://raw.githubusercontent.com/Skylinks-Golf/skylinks-scripts/feature/xyz/src/local/new_win_scripts/bootstrap.ps1)
```

## Files

| File | Purpose |
| --- | --- |
| `bootstrap.ps1` | Entry point; downloads and runs the installer |
| `setup.ps1` | Installer (debloat + apps + optimize + report) |
| `packages.txt` | Baseline app list (winget IDs) |
| `post-install-checklist.md` | Human checklist after install |
| `flipper/skylinks_admin_win_install.txt` | BadUSB payload |
