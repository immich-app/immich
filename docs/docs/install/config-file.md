# Config File

A config file can be provided as an alternative to the UI configuration.

### Step 1 - Create a new config file

In JSON format, create a new config file (e.g. `immich.json`) and put it in a location that can be accessed by Immich.
The default configuration looks like this:

<details>
<summary>immich.json</summary>

```json
{
  "ffmpeg": {
    "crf": 23,
    "threads": 0,
    "preset": "ultrafast",
    "targetVideoCodec": "h264",
    "acceptedVideoCodecs": ["h264"],
    "targetAudioCodec": "aac",
    "acceptedAudioCodecs": ["aac", "mp3", "libopus"],
    "targetResolution": "720",
    "maxBitrate": "0",
    "bframes": -1,
    "refs": 0,
    "gopSize": 0,
    "npl": 0,
    "temporalAQ": false,
    "cqMode": "auto",
    "twoPass": false,
    "preferredHwDevice": "auto",
    "transcode": "required",
    "tonemap": "hable",
    "accel": "disabled"
  },
  "job": {
    "backgroundTask": {
      "concurrency": 5
    },
    "smartSearch": {
      "concurrency": 2
    },
    "metadataExtraction": {
      "concurrency": 5
    },
    "faceDetection": {
      "concurrency": 2
    },
    "search": {
      "concurrency": 5
    },
    "sidecar": {
      "concurrency": 5
    },
    "library": {
      "concurrency": 5
    },
    "migration": {
      "concurrency": 5
    },
    "thumbnailGeneration": {
      "concurrency": 5
    },
    "videoConversion": {
      "concurrency": 1
    }
  },
  "logging": {
    "enabled": true,
    "level": "log"
  },
  "machineLearning": {
    "enabled": true,
    "url": "http://immich-machine-learning:3003",
    "clip": {
      "enabled": true,
      "modelName": "ViT-B-32__openai"
    },
    "duplicateDetection": {
      "enabled": false,
      "maxDistance": 0.03
    },
    "facialRecognition": {
      "enabled": true,
      "modelName": "buffalo_l",
      "minScore": 0.7,
      "maxDistance": 0.6,
      "minFaces": 3
    }
  },
  "map": {
    "enabled": true,
    "lightStyle": "",
    "darkStyle": ""
  },
  "reverseGeocoding": {
    "enabled": true
  },
  "oauth": {
    "enabled": false,
    "issuerUrl": "",
    "clientId": "",
    "clientSecret": "",
    "scope": "openid email profile",
    "signingAlgorithm": "RS256",
    "storageLabelClaim": "preferred_username",
    "storageQuotaClaim": "immich_quota",
    "defaultStorageQuota": 0,
    "buttonText": "Login with OAuth",
    "autoRegister": true,
    "autoLaunch": false,
    "mobileOverrideEnabled": false,
    "mobileRedirectUri": ""
  },
  "passwordLogin": {
    "enabled": true
  },
  "storageTemplate": {
    "enabled": false,
    "hashVerificationEnabled": true,
    "template": "{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}"
  },
  "image": {
    "thumbnailFormat": "webp",
    "thumbnailSize": 250,
    "previewFormat": "jpeg",
    "previewSize": 1440,
    "quality": 80,
    "colorspace": "p3",
    "extractEmbedded": false
  },
  "newVersionCheck": {
    "enabled": true
  },
  "trash": {
    "enabled": true,
    "days": 30
  },
  "theme": {
    "customCss": ""
  },
  "user": {
    "deleteDelay": 7
  },
  "library": {
    "scan": {
      "enabled": true,
      "cronExpression": "0 0 * * *"
    },
    "watch": {
      "enabled": false,
      "usePolling": false,
      "interval": 10000
    }
  },
  "server": {
    "externalDomain": "",
    "loginPageMessage": ""
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
For more information, refer to the [Environment Variables](/docs/install/environment-variables.md) section.

:::tip
YAML-formatted config files are also supported.
:::
