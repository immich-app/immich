---
sidebar_position: 100
---

# Config File

A config file can be provided as an alternative to the UI configuration.

### Step 1 - Create a new config file

In JSON format, create a new config file (e.g. `immich.json`) and put it in a location that can be accessed by Immich.
The default configuration looks like this:

<details>
<summary>immich.json</summary>

```json
{
  "backup": {
    "database": {
      "cronExpression": "0 02 * * *",
      "enabled": true,
      "keepLastAmount": 14
    }
  },
  "ffmpeg": {
    "accel": "disabled",
    "accelDecode": false,
    "acceptedAudioCodecs": ["aac", "mp3", "libopus"],
    "acceptedContainers": ["mov", "ogg", "webm"],
    "acceptedVideoCodecs": ["h264"],
    "bframes": -1,
    "cqMode": "auto",
    "crf": 23,
    "gopSize": 0,
    "maxBitrate": "0",
    "preferredHwDevice": "auto",
    "preset": "ultrafast",
    "refs": 0,
    "targetAudioCodec": "aac",
    "targetResolution": "720",
    "targetVideoCodec": "h264",
    "temporalAQ": false,
    "threads": 0,
    "tonemap": "hable",
    "transcode": "required",
    "twoPass": false
  },
  "image": {
    "colorspace": "p3",
    "extractEmbedded": false,
    "fullsize": {
      "enabled": false,
      "format": "jpeg",
      "quality": 80
    },
    "preview": {
      "format": "jpeg",
      "quality": 80,
      "size": 1440
    },
    "thumbnail": {
      "format": "webp",
      "quality": 80,
      "size": 250
    }
  },
  "job": {
    "backgroundTask": {
      "concurrency": 5
    },
    "faceDetection": {
      "concurrency": 2
    },
    "library": {
      "concurrency": 5
    },
    "metadataExtraction": {
      "concurrency": 5
    },
    "migration": {
      "concurrency": 5
    },
    "notifications": {
      "concurrency": 5
    },
    "ocr": {
      "concurrency": 1
    },
    "search": {
      "concurrency": 5
    },
    "sidecar": {
      "concurrency": 5
    },
    "smartSearch": {
      "concurrency": 2
    },
    "thumbnailGeneration": {
      "concurrency": 3
    },
    "videoConversion": {
      "concurrency": 1
    }
  },
  "library": {
    "scan": {
      "cronExpression": "0 0 * * *",
      "enabled": true
    },
    "watch": {
      "enabled": false
    }
  },
  "logging": {
    "enabled": true,
    "level": "log"
  },
  "machineLearning": {
    "availabilityChecks": {
      "enabled": true,
      "interval": 30000,
      "timeout": 2000
    },
    "clip": {
      "enabled": true,
      "modelName": "ViT-B-32__openai"
    },
    "duplicateDetection": {
      "enabled": true,
      "maxDistance": 0.01
    },
    "enabled": true,
    "facialRecognition": {
      "enabled": true,
      "maxDistance": 0.5,
      "minFaces": 3,
      "minScore": 0.7,
      "modelName": "buffalo_l"
    },
    "ocr": {
      "enabled": true,
      "maxResolution": 736,
      "minDetectionScore": 0.5,
      "minRecognitionScore": 0.8,
      "modelName": "PP-OCRv5_mobile"
    },
    "urls": ["http://immich-machine-learning:3003"]
  },
  "map": {
    "darkStyle": "https://tiles.immich.cloud/v1/style/dark.json",
    "enabled": true,
    "lightStyle": "https://tiles.immich.cloud/v1/style/light.json"
  },
  "metadata": {
    "faces": {
      "import": false
    }
  },
  "newVersionCheck": {
    "enabled": true
  },
  "nightlyTasks": {
    "clusterNewFaces": true,
    "databaseCleanup": true,
    "generateMemories": true,
    "missingThumbnails": true,
    "startTime": "00:00",
    "syncQuotaUsage": true
  },
  "notifications": {
    "smtp": {
      "enabled": false,
      "from": "",
      "replyTo": "",
      "transport": {
        "host": "",
        "ignoreCert": false,
        "password": "",
        "port": 587,
        "secure": false,
        "username": ""
      }
    }
  },
  "oauth": {
    "autoLaunch": false,
    "autoRegister": true,
    "buttonText": "Login with OAuth",
    "clientId": "",
    "clientSecret": "",
    "defaultStorageQuota": null,
    "enabled": false,
    "issuerUrl": "",
    "mobileOverrideEnabled": false,
    "mobileRedirectUri": "",
    "profileSigningAlgorithm": "none",
    "roleClaim": "immich_role",
    "scope": "openid email profile",
    "signingAlgorithm": "RS256",
    "storageLabelClaim": "preferred_username",
    "storageQuotaClaim": "immich_quota",
    "timeout": 30000,
    "tokenEndpointAuthMethod": "client_secret_post"
  },
  "passwordLogin": {
    "enabled": true
  },
  "reverseGeocoding": {
    "enabled": true
  },
  "server": {
    "externalDomain": "",
    "loginPageMessage": "",
    "publicUsers": true
  },
  "storageTemplate": {
    "enabled": false,
    "hashVerificationEnabled": true,
    "template": "{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}"
  },
  "templates": {
    "email": {
      "albumInviteTemplate": "",
      "albumUpdateTemplate": "",
      "welcomeTemplate": ""
    }
  },
  "theme": {
    "customCss": ""
  },
  "trash": {
    "days": 30,
    "enabled": true
  },
  "user": {
    "deleteDelay": 7
  }
}
```

</details>

:::tip
In Administration > Settings is a button to copy the current configuration to your clipboard.
So you can just grab it from there, paste it into a file and you're pretty much good to go.
:::

### Step 2 - Specify the file location

In your `.env` file, set the variable `IMMICH_CONFIG_FILE` to the path of your config.
For more information, refer to the [Environment Variables](/install/environment-variables.md) section.

:::tip
YAML-formatted config files are also supported.
:::
