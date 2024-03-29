# Remove Offline Files [Community]

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::note
**Before running the script**, please make sure you have a [backup](/docs/administration/backup-and-restore) of your assets and database.
:::

:::info
**None** of the scripts can delete orphaned files from the external library.
:::

This page is a guide to get rid of offline files from the repair page.

<Tabs>

<TabItem value="Python script (Best way)" label="Python script (Best way)">

This way works by retrieving a file that contains a list of all the files that are defined as offline files, running a script that uses the [Immich API](/docs/api/delete-assets) in order to remove the offline files.

1. Create an API key under Admin User -> Account Settings -> API Keys -> New API Key -> Make note of this for later.
2. Create an API key under the User that owns the Offline Files to be removed -> Account Settings -> API Keys -> New API Key -> Make note of this for later.
3. Copy and save the code to file -> `Immich Remove Offline Files.py`.
4. Run the script and follow the instructions.

:::note
You might need to run `pip install requests halo tabulate tqdm` if these dependencies are missing on your machine.
:::

```bash title='Python'
#!/usr/bin/env python3

# Note: you might need to run "pip install requests halo tabulate tqdm" if these dependencies are missing on your machine

import argparse
import json
import requests
from urllib.parse import urlparse
from halo import Halo
from tabulate import tabulate
from tqdm import tqdm

def parse_arguments():
    parser = argparse.ArgumentParser(description='Fetch file report and delete orphaned media assets from Immich.')
    # Make API key and Immich address arguments optional
    parser.add_argument('--admin_apikey', help='Immich admin API key for fetching reports', nargs='?', default=None)
    parser.add_argument('--user_apikey', help='User-specific Immich API key for deletion', nargs='?', default=None)
    parser.add_argument('--immichaddress', help='Full address for Immich, including protocol and port', nargs='?', default=None)
    parser.add_argument('--no_prompt', action='store_true', help='Delete orphaned media assets without confirmation')
    return parser.parse_args()

def filter_entities(response_json, entity_type):
    return [
        {'pathValue': entity['pathValue'], 'entityId': entity['entityId'], 'entityType': entity['entityType']}
        for entity in response_json.get('orphans', []) if entity.get('entityType') == entity_type
    ]

def main():
    args = parse_arguments()

    # Prompt for admin API key if not provided
    admin_api_key = args.admin_apikey if args.admin_apikey else input('Enter the Immich admin API key: ')
    # Prompt for user API key if not provided
    user_api_key = args.user_apikey if args.user_apikey else input('Enter the Immich user API key for deletion: ')
    # Prompt for Immich address if not provided
    immich_server = args.immichaddress if args.immichaddress else input('Enter the full web address for Immich, including protocol and port: ')

    if not admin_api_key or not user_api_key:
        print("Both admin and user API keys are required.")
        return

    immich_parsed_url = urlparse(immich_server)
    base_url = f'{immich_parsed_url.scheme}://{immich_parsed_url.netloc}'
    api_url = f'{base_url}/api'
    file_report_url = api_url + '/audit/file-report'
    headers = {'x-api-key': admin_api_key}

    print()
    spinner = Halo(text='Retrieving list of orphaned media assets...', spinner='dots')
    spinner.start()

    try:
        response = requests.get(file_report_url, headers=headers)
        response.raise_for_status()
        spinner.succeed('Success!')
    except requests.exceptions.RequestException as e:
        spinner.fail(f'Failed to fetch assets: {str(e)}')
        return

    orphan_media_assets = filter_entities(response.json(), 'asset')
    num_entries = len(orphan_media_assets)

    if num_entries == 0:
        print('No orphaned media assets found; exiting.')
        return

    if not args.no_prompt:
        table_data = [[asset['pathValue'], asset['entityId']] for asset in orphan_media_assets]
        print(tabulate(table_data, headers=['Path Value', 'Entity ID'], tablefmt='pretty'))
        print()

        summary = f'There {"is" if num_entries == 1 else "are"} {num_entries} orphaned media asset{"s" if num_entries != 1 else ""}. Would you like to delete {"them" if num_entries != 1 else "it"} from Immich? (yes/no): '
        user_input = input(summary).lower()
        print()

        if user_input not in ('y', 'yes'):
            print('Exiting without making any changes.')
            return

    headers['x-api-key'] = user_api_key  # Use user API key for deletion
    with tqdm(total=num_entries, desc="Deleting orphaned media assets", unit="asset") as progress_bar:
        for asset in orphan_media_assets:
            entity_id = asset['entityId']
            asset_url = f'{api_url}/asset'
            delete_payload = json.dumps({'force': True, 'ids': [entity_id]})
            headers = {'Content-Type': 'application/json', 'x-api-key': user_api_key}
            try:
                response = requests.delete(asset_url, headers=headers, data=delete_payload)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                print(f"Failed to delete asset {entity_id}: {str(e)}")
                continue
            progress_bar.update(1)
    print('Orphaned media assets deleted successfully!')

if __name__ == '__main__':
    main()
```

Thanks to [DooMRunneR](https://discord.com/channels/979116623879368755/1179655214870040596/1194308198413373482) and [Sircharlo](https://discord.com/channels/979116623879368755/1179655214870040596/1195038609812758639) for writing this script.

</TabItem>

<TabItem value="Bash and PowerShell script" label="Bash and PowerShell script" default>

This way works by downloading a JSON file that contains a list of all the files that are defined as offline files, running a script that uses the [Immich API](/docs/api/delete-assets) in order to remove the offline files.

1. Create an API key under Admin User -> Account Settings -> API Keys -> New API Key -> Copy to clipboard.
2. Download the JSON file under Administration -> repair -> Export.
3. Replace `YOUR_IP_HERE` and `YOUR_API_KEY_HERE` with your actual IP address and API key in the script.
4. Run the script in the same folder where the JSON file is located.

## Script for Linux based systems:

```bash title='Bash'
awk -F\" '/entityId/ {print $4}' orphans.json | while read line; do curl --location --request DELETE 'http://YOUR_IP_HERE:2283/api/asset' --header 'Content- Type: application/json' --header 'x-api-key: YOUR_API_KEY_HERE' --data '{ "force": true, "ids": ["'"$line"'"]}';done
```

## Script for the Windows system (run through PowerShell):

```powershell title='PowerShell'
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

</TabItem>
</Tabs>
