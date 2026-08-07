---
sidebar_position: 100
---

# Config file

Immich's system configuration — everything under `Administration > Settings` — is normally stored in the database and edited from the web UI. When the `IMMICH_CONFIG_FILE` environment variable is set, Immich reads that configuration from a file instead.

For a walkthrough of setting one up, see [Use a config file](/administration/use-a-config-file).

## Format

The file may be written as JSON or YAML. It is parsed as YAML, and JSON is a subset of YAML, so both are accepted regardless of the file extension.

## Location

`IMMICH_CONFIG_FILE` holds the path to the file **as seen from inside the container**, not a path on the host. Every container that runs Immich reads its own configuration, so a deployment with separate `microservices` workers needs the file mounted into those containers at the same path.

See [Environment Variables](/reference/environment-variables) for the variable itself.

## How values are resolved

- **Partial files are valid.** Any key absent from the file takes its default value, so the file only needs to contain the settings that differ from the defaults.
- **The database configuration is ignored.** While `IMMICH_CONFIG_FILE` is set, the file is the only source of system configuration; it is not merged with settings previously saved through the web UI. Those saved settings are left untouched in the database and apply again if the variable is removed.
- **Unknown keys are ignored.** They are reported as a warning in the server log.
- **Changes are not picked up automatically.** The configuration is read and cached when Immich loads it. Restart the containers to apply an edited file.

## Failure behavior

A config file is validated more strictly than the database configuration, because a mistake in it cannot be corrected from the UI:

| Condition                                        | Result                                                        |
| ------------------------------------------------ | ------------------------------------------------------------- |
| File missing, unreadable, or not valid YAML/JSON | The error is logged and configuration loading fails           |
| A value fails schema validation                  | The error is logged with the offending key, and loading fails |
| An unknown key is present                        | Logged as a warning; the key is ignored                       |

Without a config file, schema validation failures are logged but non-fatal.

## Effect on the web UI and API

- The settings in `Administration > Settings` are shown read-only.
- Requests to update the system configuration are rejected with `400 Cannot update configuration while IMMICH_CONFIG_FILE is in use`.
- The server reports `configFile: true` in its feature flags, and admin onboarding is treated as complete.

## Default configuration

The full set of keys and their default values:

<details>
<summary>immich-config.json</summary>

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
    "accelDecode": true,
    "acceptedAudioCodecs": ["aac", "mp3", "opus"],
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
    "endSessionEndpoint": "",
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
