# Immich Deployment Guide for Google Cloud Platform (GCP)

## Prerequisites
- Google Cloud Platform account
- `gcloud` CLI installed and configured
- Domain name (optional but recommended)

## Deployment Options

### Option 1: Compute Engine VM (Recommended)

#### Step 1: Create VM Instance
```bash
# Create a VM instance
gcloud compute instances create immich-server \
    --zone=us-central1-a \
    --machine-type=e2-standard-4 \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-ssd \
    --tags=http-server,https-server

# Configure firewall
gcloud compute firewall-rules create allow-immich \
    --allow=tcp:2283 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow Immich web interface"
```

#### Step 2: Connect to VM and Install Dependencies
```bash
# SSH into your VM
gcloud compute ssh immich-server --zone=us-central1-a

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Log out and log back in for docker group to take effect
exit
gcloud compute ssh immich-server --zone=us-central1-a
```

#### Step 3: Deploy Immich
```bash
# Download Immich
curl -o- https://raw.githubusercontent.com/immich-app/immich/main/install.sh | bash

# Or manually:
mkdir immich-app && cd immich-app
curl -o docker-compose.yml https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/immich-app/immich/main/docker/example.env

# Edit .env file to customize (optional)
nano .env

# Start Immich
docker compose up -d
```

#### Step 4: Access Immich
- Access via VM's external IP: `http://[EXTERNAL_IP]:2283`
- Set up admin account on first visit

### Option 2: Google Kubernetes Engine (GKE)

#### Step 1: Create GKE Cluster
```bash
# Create cluster
gcloud container clusters create immich-cluster \
    --zone=us-central1-a \
    --machine-type=e2-standard-4 \
    --num-nodes=2 \
    --disk-size=50GB

# Get credentials
gcloud container clusters get-credentials immich-cluster --zone=us-central1-a
```

#### Step 2: Deploy using Helm
```bash
# Add Immich Helm repo
helm repo add immich https://github.com/immich-app/immich-charts
helm repo update

# Install Immich
helm install immich immich/immich \
    --create-namespace \
    --namespace immich \
    --set image.tag=release \
    --set immich.persistence.library.enabled=true \
    --set immich.persistence.library.size=100Gi
```

### Option 3: Cloud Run (Limited - Not Recommended)
Cloud Run is not ideal for Immich due to:
- Need for persistent storage
- Multi-container requirements
- Database persistence needs

## Production Considerations

### 1. Storage Setup
- Use **Google Cloud Persistent Disks** for data storage
- Consider **Google Cloud Filestore** for shared storage
- Set up regular backups with **Google Cloud Storage**

### 2. Database Optimization
```bash
# For production, consider using Cloud SQL for PostgreSQL
# Update docker-compose to use external database:
# DATABASE_URL=postgresql://username:password@cloud-sql-proxy:5432/immich
```

### 3. Load Balancer & SSL
```bash
# Create load balancer
gcloud compute http-health-checks create immich-health-check \
    --port 2283 \
    --request-path "/"

# Create backend service
gcloud compute backend-services create immich-backend \
    --http-health-checks immich-health-check \
    --global

# Add VM instance to backend
gcloud compute backend-services add-backend immich-backend \
    --instance-group immich-ig \
    --instance-group-zone us-central1-a \
    --global
```

### 4. Domain & SSL Certificate
```bash
# Reserve static IP
gcloud compute addresses create immich-ip --global

# Create SSL certificate (replace with your domain)
gcloud compute ssl-certificates create immich-ssl \
    --domains=your-domain.com
```

### 5. Environment Variables for Production
Update `.env` file:
```env
# Production settings
UPLOAD_LOCATION=/mnt/disks/immich-data/library
DB_DATA_LOCATION=/mnt/disks/immich-data/postgres

# Security
DB_PASSWORD=your-super-secure-password

# Timezone
TZ=America/New_York

# Version pinning
IMMICH_VERSION=v2.1.0
```

### 6. Backup Strategy
```bash
# Create backup script
cat > backup-immich.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T database pg_dump -U postgres immich > backup_${DATE}.sql
gsutil cp backup_${DATE}.sql gs://your-backup-bucket/
rm backup_${DATE}.sql
EOF

chmod +x backup-immich.sh

# Add to cron for daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-immich.sh
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check container status
docker compose ps

# Check logs
docker compose logs immich-server
docker compose logs immich-machine-learning
```

### Updates
```bash
# Pull latest images
docker compose pull

# Restart with new images
docker compose up -d
```

## Cost Optimization Tips

1. **Use Preemptible VMs** for development
2. **Resize disk storage** as needed
3. **Use regional persistent disks** for cost savings
4. **Set up billing alerts**
5. **Consider sustained use discounts** for long-running instances

## Security Best Practices

1. **Enable OS Login** on compute instances
2. **Use service accounts** with minimal permissions
3. **Regular security updates**
4. **VPC firewall rules** instead of instance-level rules
5. **Regular backup testing**

## Troubleshooting

### Common Issues
- **Port 2283 not accessible**: Check firewall rules
- **Database connection issues**: Verify persistent disk mounting
- **Out of disk space**: Monitor disk usage and increase as needed
- **Performance issues**: Consider upgrading machine type or adding SSDs

### Useful Commands
```bash
# Check disk usage
df -h

# Monitor containers
docker stats

# Check system resources
htop

# View Immich logs
docker compose logs -f immich-server
```