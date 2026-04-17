$domains = @(
    "ad.gomtv.com",
    "log.gomtv.com",
    "cdn.gomtv.com",
    "adping.gomplay.com",
    "preads.gomtv.com",
    "smr.gomtv.com",
    "da.gomtv.com",
    "ad.gomcorp.com",
    "mc-s-gomtv.mobsense.co.kr",
    "ad.gomplay.com"
)

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$existingHosts = Get-Content $hostsPath -ErrorAction SilentlyContinue | Out-String

foreach ($domain in $domains) {
    if (-not ($existingHosts -match $domain)) {
        Add-Content -Path $hostsPath -Value "127.0.0.1 $domain"
    }
}

# Add firewall rule for GOM Player just in case
$programPath = "C:\Program Files (x86)\GOM\GOMPlayer\GOM.EXE"
if (Test-Path $programPath) {
    $rule = Get-NetFirewallRule -DisplayName "Block GOM Player Ads" -ErrorAction SilentlyContinue
    if (-not $rule) {
        New-NetFirewallRule -DisplayName "Block GOM Player Ads" -Direction Outbound -Program $programPath -Action Block
    }
}
