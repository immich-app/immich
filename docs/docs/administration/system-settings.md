# System Settings

On the system settings page, the administrator can manage global settings for the Immich instance.

:::note
Viewing and modifying the system settings is restricted to the Administrator.
:::

:::tip
You can always return to the default settings by clicking the `Reset to default` button.
:::

## Authentication Settings

Manage password, OAuth, and other authentication settings

### OAuth Authentication

Immich supports OAuth Authentication. Read more about this feature and its configuration [here](/docs/administration/oauth).

### Password Authentication

The administrator can choose to disable login with username and password for the entire instance. This means that **no one**, including the system administrator, will be able to log using this method. If [OAuth Authentication](/docs/administration/oauth) is also disabled, no users will be able to login using **any** method. Changing this setting does not affect existing sessions, just new login attempts.

:::tip
You can always use the [Server CLI](/docs/administration/server-commands) to re-enable password login.
:::

## Image Settings (thumbnails and previews)

- Thumbnails - Used in the main timeline.
- Previews - Used in the asset viewer.

By default Immich creates 3 thumbnails for each asset,
Blurred (thumbhash) , Small - thumbnails (webp) , and Large - previews (jpeg/webp), using these settings you can change the quality for the thumbnails and previews files that are created.

**Thumbnail format**  
Allows you to choose the type of format you want for the Thumbnail images, Webp produces smaller files than jpeg, but is slower to encode.

:::tip
You can read in detail about the advantages and disadvantages of using webp over jpeg on [Adobe's website](https://www.adobe.com/creativecloud/file-types/image/raster/webp-file.html)
:::

**Thumbnail resolution**  
Used when viewing groups of photos (main timeline, album view, etc.). Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness.

**Preview format**  
Allows you to choose the type of format you want for the Preview images, Webp produces smaller files than jpeg, but is slower to encode.

**Preview resolution**  
Used when viewing a single photo and for machine learning. Higher resolutions can preserve more detail but take longer to encode, have larger file sizes, and can reduce app responsiveness.

**Quality**  
Image quality from 1-100. Higher is better for quality but produces larger files, this option affects the Preview and Thumbnail images.

**Prefer wide gamut**  
Use Display P3 for thumbnails. This better preserves the vibrance of images with wide colorspaces, but images may appear differently on old devices with an old browser version. sRGB images are kept as sRGB to avoid color shifts.

**Prefer embedded preview**  
Use embedded previews in RAW photos as the input to image processing when available. This can produce more accurate colors for some images, but the quality of the preview is camera-dependent and the image may have more compression artifacts.

:::tip
The default resolution for Large thumbnails can be lowered from 1440p (default) to 1080p or 720p to save storage space.
:::

## Job Settings

Using these settings, you can determine the amount of work that will run concurrently for each task in microservices. Some tasks can be set to higher values on computers with powerful hardware and storage with good I/O capabilities.

With higher concurrency, the host will work on more assets in parallel,
this advice improves throughput, not latency, for example, it will make Smart Search jobs process more quickly, but it won't make searching faster.

It is important to remember that jobs like Smart Search, Face Detection, Facial Recognition, and Transcode Videos require a **lot** of processing power and therefore do not exaggerate the amount of jobs because you're probably thoroughly overloading the server.

:::danger IMPORTANT
If you increase the concurrency from the defaults we set, especially for thumbnail generation, make sure you do not increase them past the amount of CPU cores you have available.
Doing so can impact API responsiveness with no gain in thumbnail generation speed.
:::

:::info Facial Recognition Concurrency
The Facial Recognition Concurrency value cannot be changed because
[DBSCAN](https://www.youtube.com/watch?v=RDZUdRSDOok) is traditionally sequential, but there are parallel implementations of it out there. Our implementation isn't parallel.
:::

## External Library

### Library watching (EXPERIMENTAL)

External libraries can automatically import changed files without a full rescan. It will import the file whenever the operating system reports a file change. If your photos are mounted over the network, this does not work.

### Periodic Scanning

You can define a custom interval for the trigger external library rescan under Administration -> Settings -> Library.  
You can set the scanning interval using the preset or cron format. For more information please refer to e.g. [Crontab Guru](https://crontab.guru/).

## Logging

The default Immich log level is `Log` (commonly known as `Info`). The Immich administrator can choose a higher or lower log level according to personal preference or as requested by the Immich support team.

## Machine Learning Settings

Through this setting, you can manage all the settings related to machine learning in Immich, from the setting of remote machine learning to the model and its parameters
You can choose to disable a certain type of machine learning, for example smart search or facial recognition.

### Smart Search

The [smart search](/docs/features/smart-search) settings are designed to allow the search tool to be used using [CLIP](https://openai.com/research/clip) models that [can be changed](/docs/FAQ#can-i-use-a-custom-clip-model), different models will necessarily give better results but may consume more processing power, when changing a model it is mandatory to re-run the
Smart Search job on all images to fully apply the change.

:::info Internet connection
Changing models requires a connection to the Internet to download the model.
After downloading, there is no need for Immich to connect to the network
Unless version checking has been enabled in the settings.
:::

### Duplicate Detection

Use CLIP embeddings to find likely duplicates. The maximum detection distance can be configured in order to improve / reduce the level of accuracy.

- **Maximum detection distance -** Maximum distance between two images to consider them duplicates, ranging from 0.001-0.1. Higher values will detect more duplicates, but may result in false positives.

### Facial Recognition

Under these settings, you can change the facial recognition settings
Editable settings:

- **Facial Recognition Model**
- **Min Detection Score**
- **Max Recognition Distance**
- **Min Recognized Faces**

You can learn more about these options on the [Facial Recognition page](/docs/features/facial-recognition#how-face-detection-works)

:::info
When changing the values in Min Detection Score, Max Recognition Distance, and Min Recognized Faces.
You will have to restart **only** the job FACIAL RECOGNITION - ALL.

If you replace the Facial Recognition Model, you will have to run the job FACE DETECTION - ALL.
:::

:::tip identical twins
If you have twins, you might want to lower the Max Recognition Distance value, decreasing this a **bit** can make it distinguish between them.
:::

## Map & GPS Settings

### Map Settings

In these settings, you can change the appearance of the map in night and day modes according to your personal preference and according to the supported options.
The map can be adjusted via [OpenMapTiles](https://openmaptiles.org/styles/) for example.

### Reverse Geocoding Settings

Immich supports [Reverse Geocoding](/docs/features/reverse-geocoding) using data from the [GeoNames](https://www.geonames.org/) geographical database.

## Notification Settings

SMTP server setup, for user creation notifications, new albums, etc. More information can be found [here](/docs/administration/email-notification)

## Server Settings

### External Domain

Overrides the domain name in shared links and email notifications. The URL should not include a trailing slash.

### Welcome Message

The administrator can set a custom message on the login screen (the message will be displayed to all users).

## Storage Template

Immich supports a custom [Storage Template](/docs/administration/storage-template). Learn more about this feature and its configuration [here](/docs/administration/storage-template).

## Theme Settings

You can write custom CSS that will get loaded in the web application for all users. This enables administrators to change fonts, colors, and other styles.

For example:

```css title='Custom CSS'
p {
  color: green;
}
```

## Trash Settings

In the system administrator's option to set a trash for deleted files, these files will remain in the trash until the deletion date 30 days (default) or as defined by the system administrator.

The trash can be disabled, however this is not recommended as future files that are deleted will be permanently deleted.

:::tip Keyboard shortcut for permanently deletion
You can select assets and press Ctrl + Del from the timeline for quick permanent deletion without the trash option.
:::

## User Settings

### Delete delay

The system administrator can choose to delete users through the administration panel, the system administrator can delete users immediately or alternatively delay the deletion for users (7 days by default) this action permanently delete a user's account and assets. The user deletion job runs at midnight to check for users that are ready for deletion. Changes to this setting will be evaluated at the next execution.

## Version Check

When this option is enabled the `immich-server` will periodically make requests to GitHub to check for new releases.

## Video Transcoding Settings

The system administrator can define parameters according to which video files will be converted to different formats (depending on the settings). The settings can be changed in depth, to learn more about the terminology used here, refer to FFmpeg documentation for [H.264](https://trac.ffmpeg.org/wiki/Encode/H.264) codec, [HEVC](https://trac.ffmpeg.org/wiki/Encode/H.265) codec and [VP9](https://trac.ffmpeg.org/wiki/Encode/VP9) codec.
