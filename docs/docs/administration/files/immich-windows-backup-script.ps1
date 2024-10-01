# Variables
$containerName = "immich_postgres"
$backupFile = "immich_dump.sql.gz"
$backupPath = "/tmp/$backupFile"  # Path inside the Docker container
$backupFolder = "$Env:USERPROFILE\Desktop\Immich DB backups"  # Folder on Windows desktop to store backups

# Ensure the backup folder exists; if not, create it
if (-not (Test-Path -Path $backupFolder)) {
    Write-Host "Creating backup folder at $backupFolder..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $backupFolder
}

# Function to get the next available filename if one already exists
function Get-AvailableFilename {
    param (
        [string]$filePath
    )
    $counter = 1
    $fileDir = [System.IO.Path]::GetDirectoryName($filePath)
    $fileName = [System.IO.Path]::GetFileNameWithoutExtension($filePath)
    $fileExt = [System.IO.Path]::GetExtension($filePath)

    while (Test-Path -Path $filePath) {
        $filePath = "$fileDir\$fileName ($counter)$fileExt"
        $counter++
    }
    return $filePath
}

# Set the desktop path to store the backup in the Immich DB backups folder
$desktopPathBase = "$backupFolder\$backupFile"

# Check if the file exists and get an available filename if necessary
$desktopPath = Get-AvailableFilename -filePath $desktopPathBase

# Step 1: Create the backup inside the Docker container
Write-Host "Step 1: Creating the backup file inside the Docker container..." -ForegroundColor Cyan
docker exec -t $containerName bash -c "mkdir -p /tmp && pg_dumpall --clean --if-exists --username=postgres | gzip > $backupPath"
Write-Host "Backup created inside the Docker container at $backupPath" -ForegroundColor Green

# Step 2: Wait until the backup file is created
Write-Host "Step 2: Waiting for the backup file to be fully created..." -ForegroundColor Cyan
do {
    Start-Sleep -Seconds 2
    $fileExists = docker exec $containerName bash -c "if [ -f $backupPath ]; then echo 'exists'; else echo 'not exists'; fi"
} while ($fileExists -ne "exists")
Write-Host "Backup file found! Proceeding to copy it to the backup folder..." -ForegroundColor Green

# Step 3: Copy the backup file from the Docker container to the Immich DB backups folder
Write-Host "Step 3: Copying the backup file to $desktopPath..." -ForegroundColor Cyan
docker cp "${containerName}:${backupPath}" "$desktopPath"
Write-Host "Backup successfully copied to $desktopPath" -ForegroundColor Green

# Step 4: Remove the backup file from the Docker container
Write-Host "Step 4: Deleting the backup file from the Docker container..." -ForegroundColor Cyan
docker exec -t $containerName rm $backupPath
Write-Host "Backup file deleted from the Docker container." -ForegroundColor Green

# Final Message
Write-Host "Backup process completed successfully! The file is located in $backupFolder." -ForegroundColor Yellow
