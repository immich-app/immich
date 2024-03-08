# System Settings

The System Settings page is the page that is visible only to the server administrator, through the page you can manage the global settings that will affect all users.

## Job Settings

Using these settings, you can determine the amount of work that will run concurrently for each task in microservices. Some tasks can be set to higher values on computers with powerful hardware and storage with good I/O capabilities.

With higher concurrency, the host will work on more assets in parallel,
this advice improves throughput, not latency, for example, it will make Smart Search jobs process more quickly, but it won't make searching faster.

It is important to remember that jobs like Smart Search, Face Detection, Facial Recognition, and Transcode Videos require a **lot** of processing power and therefore do not exaggerate the amount of jobs because you're probably thoroughly overloading the server.

:::info Facial Recognition Concurrency
The Facial Recognition Concurrency value cannot be changed because
[DBSCAN](https://www.youtube.com/watch?v=RDZUdRSDOok) is traditionally sequential, but there are parallel implementations of it out there. Our implementation isn't parallel.
:::

## External Library

To add ####################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################

## Logging

By default logs are set to record at the log level, the network administrator can choose a deeper or lower level of logs according to his decision or according to the needs required by the Immich support team.

Here you can [learn about the different error levels](https://sematext.com/blog/logging-levels/).

## Machine Learning Settings

Through this setting, you can manage all the settings related to machine learning in Immich, from the setting of remote machine learning to the model and its parameters
You can choose to disable a certain type of machine learning, for example smart search or facial recognition.

### Smart Search

The smart search settings are designed to allow the search tool to be used using [CLIP](https://openai.com/research/clip) models that [can be changed](/docs/FAQ#can-i-use-a-custom-clip-model), different models will necessarily give better results but may consume more processing power, when changing a model it is mandatory to re-run the
Smart Search job on all images to fully apply the change.

:::info Internet connection
Changing models requires a connection to the Internet to download the model.
After downloading, there is no need for Immich to connect to the network
Unless version checking has been enabled in the settings.
:::

### Facial Recognition

Under these settings, you can change the facial recognition settings
Editable settings:

- **Facial Recognition Model -** Models are listed in descending order of size. Larger models are slower and use more memory, but produce better results. Note that you must re-run the Face Detection job for all images upon changing a model.
- **Min Detection Score -** Minimum confidence score for a face to be detected from 0-1. Lower values will detect more faces but may result in false positives.
- **Max Recognition Distance -** Maximum distance between two faces to be considered the same person, ranging from 0-2. Lowering this can prevent labeling two people as the same person, while raising it can prevent labeling the same person as two different people. Note that it is easier to merge two people than to split one person in two, so err on the side of a lower threshold when possible.
- **Min Recognized Faces -** The minimum number of recognized faces for a person to be created (AKA: Core face). Increasing this makes Facial Recognition more precise at the cost of increasing the chance that a face is not assigned to a person.

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
The map can be easily adjusted via [OpenMapTiles](https://openmaptiles.org/styles/) for example.

### GPS Settings

Immich supports [Reverse Geocoding](/docs/features/reverse-geocoding) using data from the [GeoNames](https://www.geonames.org/) geographical database.

## OAuth Authentication

Immich supports OAuth Authentication, since this part is long and contains many details, we separated it from this page, you can read more [here](/docs/administration/oauth).

## Password Authentication

The administrator can choose to disable the username and password globally, which will mean that **no one**, including the system administrator, will be able to log into Immich until the configuration is activated through the [Server CLI](/docs/administration/server-commands).

## Server Settings

### External Domain

Add the option to set the instance's "external domain" when constructing the shared link URL to copy to the clipboard.

### Welcome Message

The administrator can set a custom message on the login screen (the message will be displayed to all users).

## Storage Template

Immich supports the storage template option, since this section contains a lot of information, we split it into another page, read more [here](/docs/administration/storage-template).

## Theme Settings

You can write custom CSS that will get loaded in the web application for all users. This enables administrators to change fonts, colors, and other styles.

For example:

```CSS title='CSS'
  p {
  color: green
}
```

## Thumbnail Settings
