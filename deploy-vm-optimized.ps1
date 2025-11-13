# Immich VM Deployment Script for GCP (PowerShell)
# Optimized for Windows users

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$InstanceName = "immich-server",
    
    [Parameter(Mandatory=$false)]
    [string]$Zone = "us-central1-a",
    
    [Parameter(Mandatory=$false)]
    [string]$MachineType = "e2-standard-4",
    
    [Parameter(Mandatory=$false)]
    [int]$DiskSize = 100
)

Write-Host "🚀 Immich VM Deployment Script" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud version --format="value(Google Cloud SDK)" 2>$null
    Write-Host "✅ Google Cloud CLI found: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://cloud.google.com/sdk/docs/install-sdk" -ForegroundColor Yellow
    exit 1
}

# Get project ID if not provided
if ([string]::IsNullOrEmpty($ProjectId)) {
    try {
        $ProjectId = gcloud config get-value project 2>$null
        if ([string]::IsNullOrEmpty($ProjectId)) {
            Write-Host "❌ No project configured. Please set your project:" -ForegroundColor Red
            Write-Host "gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "❌ Could not get project ID. Please authenticate first:" -ForegroundColor Red
        Write-Host "gcloud auth login" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "📋 Deployment Configuration:" -ForegroundColor Cyan
Write-Host "   Project: $ProjectId"
Write-Host "   Instance: $InstanceName"
Write-Host "   Zone: $Zone"
Write-Host "   Machine Type: $MachineType"
Write-Host "   Disk Size: ${DiskSize}GB"
Write-Host ""

# Confirm deployment
$confirm = Read-Host "Continue with deployment? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable compute.googleapis.com --project=$ProjectId

# Create startup script
$startupScript = @"
#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/immich-install.log)
exec 2>&1

echo "Starting Immich installation at `$(date)"

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu

# Create immich directory
mkdir -p /home/ubuntu/immich
cd /home/ubuntu/immich

# Download latest Immich files
curl -o docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/immich-app/immich/main/docker/example.env

# Generate secure password
RANDOM_PASS=`$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)`
sed -i "s/DB_PASSWORD=postgres/DB_PASSWORD=`$RANDOM_PASS/" .env

# Set timezone (optional)
echo "TZ=America/New_York" >> .env

# Set proper ownership
chown -R ubuntu:ubuntu /home/ubuntu/immich

# Create systemd service for auto-start
cat > /etc/systemd/system/immich.service << EOF
[Unit]
Description=Immich Photo Management
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
WorkingDirectory=/home/ubuntu/immich
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

# Enable and start Immich service
systemctl enable immich.service

# Start Immich
su - ubuntu -c "cd /home/ubuntu/immich && docker compose up -d"

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Check if Immich is running
if su - ubuntu -c "cd /home/ubuntu/immich && docker compose ps | grep -q 'Up'"; then
    echo "✅ Immich installation completed successfully!"
    echo "Installation completed at `$(date)" > /home/ubuntu/install-complete.txt
else
    echo "❌ Immich installation failed!"
    echo "Installation failed at `$(date)" > /home/ubuntu/install-failed.txt
fi
"@

# Save startup script to temp file
$tempScript = [System.IO.Path]::GetTempFileName()
$startupScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📦 Creating VM instance..." -ForegroundColor Yellow

# Create VM instance
$createCommand = @"
gcloud compute instances create $InstanceName ``
    --project=$ProjectId ``
    --zone=$Zone ``
    --machine-type=$MachineType ``
    --image-family=ubuntu-2204-lts ``
    --image-project=ubuntu-os-cloud ``
    --boot-disk-size=${DiskSize}GB ``
    --boot-disk-type=pd-ssd ``
    --tags=http-server,https-server ``
    --metadata-from-file=startup-script=$tempScript
"@

try {
    Invoke-Expression $createCommand
    Write-Host "✅ VM instance created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create VM instance: $_" -ForegroundColor Red
    exit 1
}

# Clean up temp file
Remove-Item $tempScript -Force

# Configure firewall
Write-Host "🔒 Configuring firewall..." -ForegroundColor Yellow
try {
    gcloud compute firewall-rules create allow-immich-2283 --allow=tcp:2283 --source-ranges=0.0.0.0/0 --description="Allow Immich web interface" --target-tags=http-server --project=$ProjectId 2>$null
} catch {
    Write-Host "⚠️  Firewall rule may already exist, continuing..." -ForegroundColor Yellow
}

# Get external IP
Write-Host "⏳ Getting instance details..." -ForegroundColor Yellow
Start-Sleep 10

try {
    $externalIp = gcloud compute instances describe $InstanceName --zone=$Zone --project=$ProjectId --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
    
    Write-Host ""
    Write-Host "🎉 Deployment Completed!" -ForegroundColor Green
    Write-Host "========================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Instance Details:" -ForegroundColor Cyan
    Write-Host "   Name: $InstanceName"
    Write-Host "   Zone: $Zone"
    Write-Host "   External IP: $externalIp"
    Write-Host "   Project: $ProjectId"
    Write-Host ""
    Write-Host "⏳ Installation Progress:" -ForegroundColor Yellow
    Write-Host "   The startup script is installing Immich (5-10 minutes)"
    Write-Host "   You can monitor progress with the commands below"
    Write-Host ""
    Write-Host "🌐 Access Immich:" -ForegroundColor Green
    Write-Host "   URL: http://$externalIp`:2283"
    Write-Host "   (Wait 5-10 minutes for installation to complete)"
    Write-Host ""
    Write-Host "🔧 Monitor Installation:" -ForegroundColor Cyan
    Write-Host "   gcloud compute ssh $InstanceName --zone=$Zone --project=$ProjectId --command='tail -f /var/log/immich-install.log'"
    Write-Host ""
    Write-Host "✅ Check if Complete:" -ForegroundColor Green
    Write-Host "   gcloud compute ssh $InstanceName --zone=$Zone --project=$ProjectId --command='ls -la /home/ubuntu/install-complete.txt'"
    Write-Host ""
    Write-Host "📱 Mobile App Setup:" -ForegroundColor Magenta
    Write-Host "   1. Download 'Immich' app from App Store/Play Store"
    Write-Host "   2. Use server URL: http://$externalIp`:2283"
    Write-Host "   3. Create admin account when you first visit the web interface"
    Write-Host ""
    Write-Host "🛠️  Manage Immich:" -ForegroundColor Blue
    Write-Host "   SSH: gcloud compute ssh $InstanceName --zone=$Zone --project=$ProjectId"
    Write-Host "   Logs: docker compose logs -f (from /home/ubuntu/immich directory)"
    Write-Host "   Restart: docker compose restart"
    Write-Host "   Update: docker compose pull && docker compose up -d"
    Write-Host ""
    
} catch {
    Write-Host "⚠️  Could not get external IP. Check the GCP console for instance details." -ForegroundColor Yellow
}

Write-Host "💡 Next Steps:" -ForegroundColor Green
Write-Host "   1. Wait 5-10 minutes for installation"
Write-Host "   2. Visit the URL above to set up admin account"
Write-Host "   3. Download mobile app and connect"
Write-Host "   4. Start uploading your photos!"
Write-Host ""
Write-Host "📖 Need help? Check the documentation:"
Write-Host "   - Immich Docs: https://docs.immich.app/"
Write-Host "   - GitHub: https://github.com/immich-app/immich"
Write-Host ""