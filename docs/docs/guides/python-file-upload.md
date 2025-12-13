# Python File Upload

```python
#!/usr/bin/python3

import requests
import os
from datetime import datetime

API_KEY = 'YOUR_API_KEY'                # replace with a valid api key
BASE_URL = 'http://127.0.0.1:2283/api'  # replace as needed


def upload(file):
    stats = os.stat(file)

    headers = {
        'Accept': 'application/json',
        'x-api-key': API_KEY
    }

    data = {
        'deviceAssetId': f'{file}-{stats.st_mtime}',
        'deviceId': 'python',
        'fileCreatedAt': datetime.fromtimestamp(stats.st_mtime),
        'fileModifiedAt': datetime.fromtimestamp(stats.st_mtime),
        'isFavorite': 'false',
    }

    files = {
        'assetData': open(file, 'rb')
    }

    response = requests.post(
        f'{BASE_URL}/assets', headers=headers, data=data, files=files)

    print(response.json())
    # {'id': 'ef96f635-61c7-4639-9e60-61a11c4bbfba', 'duplicate': False}


upload('./test.jpg')
```
