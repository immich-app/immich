# Variables
$containerName = "immich_postgres"
$backupFolder = "$Env:USERPROFILE\Desktop\Immich DB backups"  # Backup folder on desktop
$backupFile = "immich_dump.sql.gz"  # Specify the backup file to restore
$localBackupPath = "$backupFolder\$backupFile"  # Path to the backup on Windows
$containerBackupPath = "/tmp/$backupFile"  # Path inside the Docker container

# Step 1: Check if the backup file exists on the desktop
if (-not (Test-Path -Path $localBackupPath)) {
    Write-Host "Error: Backup file $backupFile does not exist in $backupFolder!" -ForegroundColor Red
    exit
}
Write-Host "Step 1: Found backup file $backupFile in $backupFolder" -ForegroundColor Green

# Step 2: Copy the backup file to the Docker container
Write-Host "Step 2: Copying the backup file to the Docker container..." -ForegroundColor Cyan
docker cp "$localBackupPath" "${containerName}:${containerBackupPath}"
Write-Host "Backup file copied to $containerBackupPath inside the Docker container." -ForegroundColor Green

# Step 3: Check if the gzip file exists inside the container
Write-Host "Step 3: Checking if the backup file was successfully copied inside the Docker container..." -ForegroundColor Cyan
$gzipExists = docker exec $containerName bash -c "[ -f $containerBackupPath ] && echo 'exists' || echo 'not exists'"
if ($gzipExists -ne "exists") {
    Write-Host "Error: Backup file $containerBackupPath does not exist inside the container!" -ForegroundColor Red
    exit
}
Write-Host "Backup file exists inside the container, proceeding to extract..." -ForegroundColor Green

# Step 4: Extract the gzip file inside the Docker container
Write-Host "Step 4: Extracting the backup file inside the Docker container..." -ForegroundColor Cyan
docker exec -t $containerName bash -c "gunzip -f $containerBackupPath"
$extractedBackupFile = "/tmp/immich_dump.sql"  # Path to the extracted SQL file inside the container


# Step 6: Restore the backup using psql
Write-Host "Step 6: Restoring the database from $extractedBackupFile..." -ForegroundColor Cyan
docker exec -t $containerName bash -c "psql --username=postgres < $extractedBackupFile"
Write-Host "Database restored successfully." -ForegroundColor Green

# Step 7: Clean up by removing the extracted file
Write-Host "Step 7: Removing the extracted SQL file from the Docker container..." -ForegroundColor Cyan
docker exec -t $containerName rm $extractedBackupFile
Write-Host "Cleanup completed. Restore process finished successfully!" -ForegroundColor Yellow
