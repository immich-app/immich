$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut("$PSScriptRoot\..\Uploads.lnk")
$shortcut.TargetPath = "\\wsl.localhost\Ubuntu\var\immich\upload"
$shortcut.Description = "Immich Media Uploads"
$shortcut.Save()
Write-Host "Created Uploads.lnk"

