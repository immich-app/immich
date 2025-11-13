#!/bin/bash
# Immich Deployment Script for Google Cloud Shell
# Run this in Cloud Shell at https://shell.cloud.google.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Immich Deployment Script for Google Cloud${NC}"
echo -e "${GREEN}=============================================${NC}"

# Configuration with defaults
INSTANCE_NAME="${1:-immich-server}"
ZONE="${2:-us-central1-a}"
MACHINE_TYPE="${3:-e2-standard-4}"
DISK_SIZE="${4:-100}"

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No project configured. Please set your project:${NC}"
    echo -e "${YELLOW}gcloud config set project YOUR_PROJECT_ID${NC}"
    exit 1
fi

echo -e "${CYAN}📋 Deployment Configuration:${NC}"
echo "   Project: $PROJECT_ID"
echo "   Instance: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo "   Machine Type: $MACHINE_TYPE"
echo "   Disk Size: ${DISK_SIZE}GB"
echo ""

# Confirm deployment
echo -e "${YELLOW}Continue with deployment? (y/N)${NC}"
read -r confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs...${NC}"
gcloud services enable compute.googleapis.com

# Create startup script
cat > startup-script.sh << 'EOF'
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

# Set timezone
echo "TZ=America/New_York" >> .env

# Set proper ownership
chown -R ubuntu:ubuntu /home/ubuntu/immich

# Create systemd service for auto-start
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/immich.service << EOSERVICE
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
if su - ubuntu -c "cd /home/ubuntu/immich && docker compose ps --format json | jq -r '.[].State' | grep -q running"; then
    echo "✅ Immich installation completed successfully!"
    echo "🎉 Installation completed at $(date)" > /home/ubuntu/install-complete.txt
    
    # Get container status
    echo "📊 Container Status:" >> /home/ubuntu/install-complete.txt
    su - ubuntu -c "cd /home/ubuntu/immich && docker compose ps" >> /home/ubuntu/install-complete.txt
else
    echo "❌ Immich installation failed!"
    echo "💥 Installation failed at $(date)" > /home/ubuntu/install-failed.txt
    
    # Log container status for debugging
    echo "📊 Container Status:" >> /home/ubuntu/install-failed.txt
    su - ubuntu -c "cd /home/ubuntu/immich && docker compose ps" >> /home/ubuntu/install-failed.txt 2>/dev/null || echo "Could not get container status" >> /home/ubuntu/install-failed.txt
fi

echo "📋 Installation log saved to /var/log/immich-install.log"
EOF

# Create VM instance
echo -e "${YELLOW}📦 Creating VM instance...${NC}"
gcloud compute instances create $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=${DISK_SIZE}GB \
    --boot-disk-type=pd-ssd \
    --tags=http-server,https-server \
    --metadata-from-file=startup-script=startup-script.sh

echo -e "${GREEN}✅ VM instance created successfully!${NC}"

# Configure firewall
echo -e "${YELLOW}🔒 Configuring firewall...${NC}"
if ! gcloud compute firewall-rules describe allow-immich-2283 &>/dev/null; then
    gcloud compute firewall-rules create allow-immich-2283 \
        --allow=tcp:2283 \
        --source-ranges=0.0.0.0/0 \
        --description="Allow Immich web interface" \
        --target-tags=http-server \
        --project=$PROJECT_ID
    echo -e "${GREEN}✅ Firewall rule created${NC}"
else
    echo -e "${YELLOW}⚠️ Firewall rule already exists${NC}"
fi

# Get external IP
echo -e "${YELLOW}⏳ Getting instance details...${NC}"
sleep 10

EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --project=$PROJECT_ID \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

# Clean up temp file
rm -f startup-script.sh

echo ""
echo -e "${GREEN}🎉 Deployment Completed!${NC}"
echo -e "${GREEN}========================${NC}"
echo ""
echo -e "${CYAN}📋 Instance Details:${NC}"
echo "   Name: $INSTANCE_NAME"
echo "   Zone: $ZONE"
echo "   External IP: $EXTERNAL_IP"
echo "   Project: $PROJECT_ID"
echo ""
echo -e "${YELLOW}⏳ Installation Progress:${NC}"
echo "   The startup script is installing Immich (5-10 minutes)"
echo "   You can monitor progress with the commands below"
echo ""
echo -e "${GREEN}🌐 Access Immich:${NC}"
echo "   URL: http://$EXTERNAL_IP:2283"
echo "   (Wait 5-10 minutes for installation to complete)"
echo ""
echo -e "${CYAN}🔧 Monitor Installation:${NC}"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command='tail -f /var/log/immich-install.log'"
echo ""
echo -e "${GREEN}✅ Check if Complete:${NC}"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID --command='cat /home/ubuntu/install-complete.txt 2>/dev/null || echo \"Still installing...\"'"
echo ""
echo -e "${BLUE}📱 Mobile App Setup:${NC}"
echo "   1. Download 'Immich' app from App Store/Play Store"
echo "   2. Use server URL: http://$EXTERNAL_IP:2283"
echo "   3. Create admin account when you first visit the web interface"
echo ""
echo -e "${CYAN}🛠️ Manage Immich:${NC}"
echo "   SSH: gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID"
echo "   Logs: cd immich && docker compose logs -f"
echo "   Restart: docker compose restart"
echo "   Update: docker compose pull && docker compose up -d"
echo ""
echo -e "${GREEN}💡 Next Steps:${NC}"
echo "   1. Wait 5-10 minutes for installation"
echo "   2. Visit the URL above to set up admin account"
echo "   3. Download mobile app and connect"
echo "   4. Start uploading your photos!"
echo ""
echo -e "${BOLD}📖 Need help? Check the documentation:${NC}"
echo "   - Immich Docs: https://docs.immich.app/"
echo "   - GitHub: https://github.com/immich-app/immich"