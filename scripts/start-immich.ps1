# Start Immich Services (No Docker)
Write-Host "Starting Immich Services..." -ForegroundColor Cyan

# 1. Start systemd services in WSL
wsl -u root -d Ubuntu systemctl start redis-server postgresql immich-ml immich-server

# 2. Keepalive process to prevent WSL from sleeping while active
$keepAlive = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*wsl*sleep infinity*" }
if (-not $keepAlive) {
    Start-Process -FilePath "wsl" -ArgumentList "-d Ubuntu -- sleep infinity" -WindowStyle Hidden
}

# 3. Start Port Proxy on Windows if not already running
$proxyProcess = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*port_proxy.py*" }
if (-not $proxyProcess) {
    $proxyScript = Join-Path $PSScriptRoot "..\scratch\port_proxy.py"
    if (-not (Test-Path $proxyScript)) {
        $proxyScript = "C:\Users\mohit\.gemini\antigravity\brain\1438c688-7e1e-4af2-8d6c-75b17352b06e\scratch\port_proxy.py"
    }
    if (Test-Path $proxyScript) {
        Start-Process -FilePath "python" -ArgumentList "`"$proxyScript`"" -WindowStyle Hidden
    }
}

# 4. Start Web UI Dev Server on Windows if not already running
$webListening = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $webListening) {
    Write-Host "Starting Web UI (port 3000)..." -ForegroundColor Cyan
    $webDir = Join-Path $PSScriptRoot "..\web"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$webDir`" && node node_modules\vite\bin\vite.js --host 0.0.0.0 --port 3000" -WindowStyle Hidden
}

# 5. Wait for Backend API to become ready (max 90s)
Write-Host "Waiting for Immich Backend (port 2283) to initialize..." -NoNewline
$backendReady = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 3
    $check = try { (Invoke-WebRequest -Uri "http://127.0.0.1:2283/api/server/ping" -UseBasicParsing -TimeoutSec 2).Content } catch { $null }
    if ($check -and $check -like "*pong*") {
        $backendReady = $true
        break
    }
    Write-Host "." -NoNewline
}
Write-Host ""

if ($backendReady) {
    Write-Host "All services are ONLINE and ready!" -ForegroundColor Green
} else {
    Write-Host "Backend is still initializing modules in background. Check status shortly." -ForegroundColor Yellow
}



