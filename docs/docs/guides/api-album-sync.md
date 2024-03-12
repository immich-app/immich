# API Album Sync (Python Script)

This is an example of a python script for syncing an album to a local folder. This was used for a digital photoframe so the displayed photos could be managed from the immich web or app UI.

The script is copied below in it's current form. A repository is hosted [here](https://git.orenit.solutions/open/immichalbumpull).

:::danger
This guide uses a generated API key. This key gives the same access to your immich instance as the user it is attached to, so be careful how the config file is stored and transferred.
:::

### Prerequisites

- Python 3.7+
- [requests library](https://pypi.org/project/requests/)

### Installing

Copy the contents of 'pull.py' (shown below) to your chosen location or clone the repository:

```bash
git clone https://git.orenit.solutions/open/immichalbumpull
```

Edit or create the 'config.ini' file in the same directory as the script with the necessary details:

```ini title='config.ini'
[immich]
# URL of target immich instance
url = https://photo.example.com
# API key from Account Settings -> API Keys
apikey = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Full local path to target directory
destination = /home/photo/photos
# immich album name
album = Photoframe
```

### Usage

Run the script directly:

```bash
./pull.py
```

Or from cron (every 5 minutes):

```bash
*/5 * * * * /usr/bin/python /home/user/immichalbumpull/pull.py
```

### Python Script

```python title='pull.py'
#!/usr/bin/env python

import requests
import configparser
import os
import shutil

# Read config file
config = configparser.ConfigParser()
config.read('config.ini')

url = config['immich']['url']
apikey = config['immich']['apikey']
photodir = config['immich']['destination']
albumname = config['immich']['album']

headers = {
    'Accept': 'application/json',
    'x-api-key': apikey
}

# Set up the directory for the downloaded images
os.makedirs(photodir, exist_ok=True)

# Get the list of albums from the API
response = requests.get(url + "/api/album", headers=headers)

# Parse the JSON response
data = response.json()

# Find the chosen album id
for item in data:
    if item['albumName'] == albumname:
        albumid = item['id']

# Get the list of photos from the API using the albumid
response = requests.get(url + "/api/album/" + albumid, headers=headers)

# Parse the JSON response and extract the URLs of the images
data = response.json()
image_urls = data['assets']

# Download each image from the URL and save it to the directory
headers = {
    'Accept': 'application/octet-stream',
    'x-api-key': apikey
}

photolist = []

for id in image_urls:
    # Query asset info endpoint for correct extension
    assetinfourl = url + "/api/asset/" + str(id['id'])
    response = requests.get(assetinfourl, headers=headers)
    assetinfo = response.json()
    ext = os.path.splitext(assetinfo['originalFileName'])

    asseturl = url + "/api/download/asset/" + str(id['id'])
    response = requests.post(asseturl, headers=headers, stream=True)

    # Build current photo list for deletions below
    photo = os.path.basename(asseturl) + ext[1]
    photolist.append(photo)

    photofullpath = photodir + '/' + os.path.basename(asseturl) + ext[1]
    # Only download file if it doesn't already exist
    if not os.path.exists(photofullpath):
        with open(photofullpath, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)

# Delete old photos removed from album
for filename in os.listdir(photodir):
    if filename not in photolist:
        os.unlink(os.path.join(photodir, filename))
```
