#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/immich-install.log)
exec 2>&1

echo "🚀 Starting Immich installation at $(date)"

# Update system
echo "📦 Updating system packages..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker ubuntu
rm get-docker.sh

# Install jq for JSON parsing
apt-get install -y jq

# Create immich directory
echo "📁 Creating Immich directory..."
mkdir -p /home/ubuntu/immich
cd /home/ubuntu/immich

# Download latest Immich files
echo "⬇️ Downloading Immich files..."
curl -o docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/immich-app/immich/main/docker/example.env

# Generate secure password
echo "🔐 Generating secure database password..."
RANDOM_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
sed -i "s/DB_PASSWORD=postgres/DB_PASSWORD=$RANDOM_PASS/" .env

# Set timezone to US Eastern
echo "TZ=America/New_York" >> .env

# Set proper ownership
chown -R ubuntu:ubuntu /home/ubuntu/immich

# Create systemd service for auto-start
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/immich.service << 'EOSERVICE'
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
Group=ubuntu

[Install]
WantedBy=multi-user.target
EOSERVICE

# Enable service
systemctl enable immich.service

# Start Immich
echo "🚀 Starting Immich containers..."
su - ubuntu -c "cd /home/ubuntu/immich && docker compose up -d"

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 60

# Check if Immich is running
echo "🔍 Checking container status..."
if su - ubuntu -c "cd /home/ubuntu/immich && docker compose ps --format json 2>/dev/null | jq -r '.[].State' 2>/dev/null | grep -q running"; then
    echo "✅ Immich installation completed successfully!"
    echo "🎉 Installation completed at $(date)" > /home/ubuntu/install-complete.txt
    
    # Get container status
    echo "📊 Container Status:" >> /home/ubuntu/install-complete.txt
    su - ubuntu -c "cd /home/ubuntu/immich && docker compose ps" >> /home/ubuntu/install-complete.txt 2>/dev/null
else
    # Fallback check without jq
    if su - ubuntu -c "cd /home/ubuntu/immich && docker compose ps | grep -q 'Up'"; then
        echo "✅ Immich installation completed successfully!"
        echo "🎉 Installation completed at $(date)" > /home/ubuntu/install-complete.txt
    else
        echo "❌ Immich installation may have issues, check logs"
        echo "⚠️ Installation completed with warnings at $(date)" > /home/ubuntu/install-complete.txt
    fi
    
    # Log container status for debugging
    echo "📊 Container Status:" >> /home/ubuntu/install-complete.txt
    su - ubuntu -c "cd /home/ubuntu/immich && docker compose ps" >> /home/ubuntu/install-complete.txt 2>/dev/null || echo "Could not get container status" >> /home/ubuntu/install-complete.txt
fi

echo "📋 Installation log saved to /var/log/immich-install.log"
echo "🔚 Startup script completed at $(date)"