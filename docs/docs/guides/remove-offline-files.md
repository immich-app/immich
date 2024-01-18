# Remove Offline Files

:::note
**Before running the script**, please make sure you have a [backup](/docs/administration/backup-and-restore) of your assets and database
:::

This page is a guide to get rid of offline files from the repair page.

This way works by downloading a JSON file that contains a list of all the files that are defined as offline files, running a script that uses the [Immich API](/docs/api/delete-assets) in order to remove the offline files.

1. Create an API key under Admin User -> Account Settings -> API Keys -> New API Key -> Copy to clipboard.
2. Download the JSON file under Administration -> repair -> Export.
3. Replace `YOUR_IP_HERE` and `YOUR_API_KEY_HERE` with your actual IP address and API key in the script.
4. Run the script in the same folder where the JSON file is located.

## Script for Linux based systems:

```
awk -F\" '/entityId/ {print $4}' orphans.json | while read line; do curl --location --request DELETE 'http://YOUR_IP_HERE:2283/api/asset' --header 'Content- Type: application/json' --header 'x-api-key: YOUR_API_KEY_HERE' --data '{ "force": true, "ids": ["'"$line"'"]}';done
```

## Script for the Windows system (run through PowerShell):

```
Get-Content orphans.json | Select-String -Pattern 'entityId' | ForEach-Object {
  $line = $_ -split '"' | Select-Object -Index 3
  $body = [pscustomobject]@{
    'ids' = @($line)
    'force' = (' true ' | ConvertFrom-Json)
  } | ConvertTo-Json -Depth 3
  Invoke-RestMethod -Uri 'http://YOUR_IP_HERE:2283/api/asset' -Method Delete -Headers @{
    'Content-Type' = 'application/json'
    'x-api-key' = 'YOUR_API_KEY_HERE'
  } -Body $body
}
```

Thanks to [DooMRunneR](https://discord.com/channels/979116623879368755/1179655214870040596/1194308198413373482) for writing this script.
