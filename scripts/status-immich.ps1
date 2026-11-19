Write-Host "Checking Immich Services..." -ForegroundColor Cyan

$serverRaw = try { (& "curl.exe" -s --max-time 3 "http://127.0.0.1:2283/api/server/version") } catch { $null }
$mlRaw = try { (& "curl.exe" -s --max-time 3 "http://127.0.0.1:3003/ping") } catch { $null }
$webCode = try { (& "curl.exe" -s -o /dev/null -w "%{http_code}" --max-time 3 "http://127.0.0.1:3000/") } catch { $null }

[PSCustomObject]@{
    "Immich Backend (http://localhost:2283)" = if ($serverRaw -and $serverRaw -like "*major*") { "Online ($serverRaw)" } else { "Offline" }
    "Immich ML (http://localhost:3003)"      = if ($mlRaw -eq "pong") { "Online (pong)" } else { "Offline" }
    "Immich Web (http://localhost:3000)"     = if ($webCode -eq "200") { "Online (HTTP 200)" } else { "Offline ($webCode)" }
} | Format-List
