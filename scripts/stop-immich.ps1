# Stop Immich Services (No Docker)
Write-Host "Stopping Immich Services..." -ForegroundColor Yellow

# 1. Stop WSL systemd services
wsl -u root -d Ubuntu systemctl stop immich-web immich-server immich-ml redis-server postgresql

# 2. Terminate background port proxy and keepalive processes on Windows
Get-CimInstance Win32_Process | Where-Object { 
    $_.CommandLine -like "*port_proxy.py*" -or $_.CommandLine -like "*wsl*sleep infinity*"
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# 3. Terminate Web dev servers (port 3000, 3001, 3005) and Vite/Expo Node processes
Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq "node.exe" -and ($_.CommandLine -like "*vite*" -or $_.CommandLine -like "*expo*")
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Kill any lingering process listening on web port 3000 or 3005
$ports = @(3000, 3005)
foreach ($p in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Immich services and web servers stopped completely." -ForegroundColor Green



