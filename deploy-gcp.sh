#!/bin/bash

# Immich GCP Quick Deploy Script
# This script creates a VM instance and deploys Immich on Google Cloud Platform

set -e

# Configuration
INSTANCE_NAME="immich-server"
ZONE="us-central1-a"
MACHINE_TYPE="e2-standard-4"
DISK_SIZE="100GB"
PROJECT_ID="${GCLOUD_PROJECT:-$(gcloud config get-value project)}"

echo "🚀 Starting Immich deployment on GCP..."
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo "Zone: $ZONE"

# Check if gcloud is configured
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with gcloud first:"
    echo "gcloud auth login"
    exit 1
fi

# Create VM instance
echo "📦 Creating VM instance..."
gcloud compute instances create $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=$DISK_SIZE \
    --boot-disk-type=pd-ssd \
    --tags=http-server,https-server \
    --metadata=startup-script='#!/bin/bash
        # Update system
        apt update && apt upgrade -y
        
        # Install Docker
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        usermod -aG docker ubuntu
        
        # Install Docker Compose
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        
        # Create immich directory
        mkdir -p /home/ubuntu/immich-app
        cd /home/ubuntu/immich-app
        
        # Download Immich files
        curl -o docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
        curl -o .env https://raw.githubusercontent.com/immich-app/immich/main/docker/example.env
        
        # Generate random password
        RANDOM_PASS=$(openssl rand -base64 32)
        sed -i "s/DB_PASSWORD=postgres/DB_PASSWORD=$RANDOM_PASS/" .env
        
        # Set ownership
        chown -R ubuntu:ubuntu /home/ubuntu/immich-app
        
        # Start Immich (as ubuntu user)
        su - ubuntu -c "cd /home/ubuntu/immich-app && docker compose up -d"
        
        echo "Immich installation completed!" > /home/ubuntu/install-complete.txt
    '

# Configure firewall
echo "🔒 Configuring firewall..."
gcloud compute firewall-rules create allow-immich-2283 \
    --allow=tcp:2283 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow Immich web interface" \
    --target-tags=http-server || echo "Firewall rule may already exist"

# Get external IP
echo "⏳ Waiting for instance to start..."
sleep 30

EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

echo "✅ Deployment initiated!"
echo ""
echo "📋 Instance Details:"
echo "   Name: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo "   External IP: $EXTERNAL_IP"
echo ""
echo "⏳ Installation is running in the background (5-10 minutes)..."
echo ""
echo "🌐 Once installation completes, access Immich at:"
echo "   http://$EXTERNAL_IP:2283"
echo ""
echo "🔧 To check installation progress:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='tail -f /var/log/syslog'"
echo ""
echo "🔍 To check if installation is complete:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command='ls -la /home/ubuntu/install-complete.txt'"
echo ""
echo "📁 To manage Immich:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "   cd immich-app"
echo "   docker compose logs -f"
echo ""
echo "💡 First-time setup:"
echo "   1. Go to http://$EXTERNAL_IP:2283"
echo "   2. Create your admin account"
echo "   3. Download the mobile app and use the server URL above"