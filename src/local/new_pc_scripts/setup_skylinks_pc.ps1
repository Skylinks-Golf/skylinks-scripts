<#
.SYNOPSIS
    Skylinks Windows 11 PC Initialization Script.
    Combines bloatware removal, system optimization, and app provisioning.

.NOTES
    Author: Koad (AI) for Ian Deans
    Version: 2.0
    License: Private (Skylinks Golf)
#>

# 1. Administrator Check
if (-Not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole("Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator." -ForegroundColor Red
    Exit 1
}

# 2. Configuration
$AppsToInstall = @(
    "Google.Chrome",
    "SlackTechnologies.Slack",
    "Git.Git",
    "Microsoft.PowerShell",
    "StarMicronics.StarPrinterUtility",
    "Epson.ScanSmart"
)

$WindowsBloatware = @(
    "Microsoft.3DBuilder", "Microsoft.BingWeather", "Microsoft.GetHelp", "Microsoft.Getstarted",
    "Microsoft.MicrosoftSolitaireCollection", "Microsoft.MicrosoftOfficeHub", "Microsoft.MixedReality.Portal",
    "Microsoft.OneConnect", "Microsoft.People", "Microsoft.Print3D", "Microsoft.SkypeApp",
    "Microsoft.StorePurchaseApp", "Microsoft.Todos", "Microsoft.WindowsAlarms", "Microsoft.WindowsCamera",
    "Microsoft.WindowsFeedbackHub", "Microsoft.WindowsMaps", "Microsoft.Xbox.TCUI", "Microsoft.XboxApp",
    "Microsoft.XboxGameOverlay", "Microsoft.XboxGamingOverlay", "Microsoft.XboxIdentityProvider",
    "Microsoft.XboxSpeechToTextOverlay", "Microsoft.YourPhone", "Microsoft.ZuneMusic", "Microsoft.ZuneVideo"
)

$ThirdPartyBloatware = @(
    "Spotify.Spotify", "AdobeReader", "DisneyPlus.DisneyPlus", "Tiktok.Tiktok",
    "FacebookMessenger", "Instagram", "Twitter"
)

# 3. Functions
function Optimize-System {
    Write-Host "[*] Optimizing Power Settings..." -ForegroundColor Cyan
    powercfg /change monitor-timeout-ac 0
    powercfg /change standby-timeout-ac 0
    powercfg /change monitor-timeout-dc 15
    powercfg /change standby-timeout-dc 30

    Write-Host "[*] Disabling Telemetry & Cortana..." -ForegroundColor Cyan
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\DataCollection" -Name "AllowTelemetry" -Value 0 -ErrorAction SilentlyContinue
    Get-AppxPackage -allusers Microsoft.549981C3F5F10 | Remove-AppxPackage -ErrorAction SilentlyContinue
}

function Remove-Bloatware {
    Write-Host "[*] Removing Windows Appx Bloatware..." -ForegroundColor Yellow
    foreach ($app in $WindowsBloatware) {
        Get-AppxPackage -AllUsers -Name $app | Remove-AppxPackage -ErrorAction SilentlyContinue
        Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like "*$app*" | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
    }

    Write-Host "[*] Uninstalling Third-Party Bloatware..." -ForegroundColor Yellow
    foreach ($app in $ThirdPartyBloatware) {
        Start-Process -NoNewWindow -Wait -FilePath "winget" -ArgumentList "uninstall --id=$app --silent --accept-source-agreements --accept-package-agreements" -ErrorAction SilentlyContinue
    }
}

function Install-Apps {
    Write-Host "[*] Installing Required Applications via Winget..." -ForegroundColor Green
    foreach ($App in $AppsToInstall) {
        Write-Host "Installing: $App"
        Start-Process -NoNewWindow -Wait -FilePath "winget" -ArgumentList "install --id=$App --scope machine --silent --accept-source-agreements --accept-package-agreements" -ErrorAction SilentlyContinue
    }
}

# 4. Main Execution
Write-Host "--- Skylinks PC Setup Started ---" -ForegroundColor Cyan
Optimize-System
Remove-Bloatware
Install-Apps

$DownloadPath = "C:\SkylinksDrivers"
if (!(Test-Path $DownloadPath)) { New-Item -ItemType Directory -Path $DownloadPath | Out-Null }
$DriverReadme = "$DownloadPath\README.txt"
"Star TSP100 Driver Page: https://starmicronics.com/support/products/tsp100iv-support-page/" | Out-File $DriverReadme

Write-Host "--- Setup Complete! System optimized and apps provisioned. ---" -ForegroundColor Green
