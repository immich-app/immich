# Immich Local Development Setup

## Quick Start (Local Testing)

If you want to test Immich locally before deploying to GCP:

### Prerequisites
- Docker Desktop installed
- At least 4GB RAM available

### Local Setup Steps

1. **Navigate to the docker folder:**
   ```bash
   cd docker
   ```

2. **Copy environment file:**
   ```bash
   cp example.env .env
   ```

3. **Edit the .env file (optional):**
   ```bash
   # Change upload location if needed
   UPLOAD_LOCATION=./library
   
   # Change database location if needed  
   DB_DATA_LOCATION=./postgres
   
   # Generate a secure password
   DB_PASSWORD=your_secure_password_here
   ```

4. **Start Immich:**
   ```bash
   docker compose up -d
   ```

5. **Access Immich:**
   - Open browser to: `http://localhost:2283`
   - Create admin account on first visit

6. **Useful commands:**
   ```bash
   # Check status
   docker compose ps
   
   # View logs
   docker compose logs -f
   
   # Stop Immich
   docker compose down
   
   # Update Immich
   docker compose pull
   docker compose up -d
   ```

### Local Development Notes

- **Data persistence:** Your photos and database are stored in `./library` and `./postgres` folders
- **Backup:** Always backup these folders before major updates
- **Performance:** Machine learning features may be slower on local machines
- **Mobile app:** Use `http://your-local-ip:2283` as server URL in mobile app

### Troubleshooting Local Setup

1. **Port 2283 already in use:**
   ```bash
   # Change port in docker-compose.yml
   ports:
     - '3001:2283'  # Use port 3001 instead
   ```

2. **Out of disk space:**
   ```bash
   # Check Docker disk usage
   docker system df
   
   # Clean up if needed
   docker system prune
   ```

3. **Performance issues:**
   - Increase Docker Desktop memory allocation
   - Disable machine learning if not needed
   - Use SSD storage for better performance

## Migration from Local to GCP

When ready to move from local testing to GCP production:

1. **Backup your data:**
   ```bash
   # Export your data
   docker compose exec database pg_dump -U postgres immich > backup.sql
   
   # Backup photos
   tar -czf photos-backup.tar.gz library/
   ```

2. **Deploy to GCP using the provided script:**
   ```bash
   bash deploy-gcp.sh
   ```

3. **Restore data to GCP instance:**
   ```bash
   # Copy backup to GCP instance
   gcloud compute scp backup.sql photos-backup.tar.gz immich-server:~/ --zone=us-central1-a
   
   # SSH into GCP instance and restore
   gcloud compute ssh immich-server --zone=us-central1-a
   
   # Restore database
   docker compose exec -T database psql -U postgres immich < backup.sql
   
   # Restore photos
   tar -xzf photos-backup.tar.gz -C immich-app/
   ```