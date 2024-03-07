# System Settings

The System Settings page is the page that is visible only to the server administrator, through the page you can manage the global settings that will affect all users.

## Job Settings

Using these settings, you can determine the amount of work that will run concurrently for each individual task in microservices. Some tasks can be set to higher values on computers with powerful hardware and storage with good I/O capabilities.

With higher concurrency, the host will work on more assets in parallel,
this advice improves throughput, not latency, for example it will make Smart Search jobs process more quickly, but it won't make searching faster.

It is important to remember that jobs like Smart Search, Face Detection, Facial Recognition, Transcode Videos require a **lot** of processing power and therefore do not exaggerate with the amount of jobs because you're probably thoroughly overloading the server.

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

Through this setting, you can manage all the settings related to machine learning in Immich, from the setting of remote machine learning to the model model and its parameters
You can choose to disable a certain type of machine learning, for example smart search or facial recognition.

### Smart Search

The smart search settings are designed to allow the search tool to be used using [CLIP](https://openai.com/research/clip) models that [can be changed](/docs/FAQ#can-i-use-a-custom-clip-model), different models will necessarily give better results but may consume more processing power, when changing a model it is mandatory to re-run the
Smart Search job on all images in order to fully apply the change.

:::info Internet connection
Changing models requires a connection to the Internet in order to download the model.
After downloading, there is no need for Immich to connect to the network
Unless version checking has been enabled in the settings.
:::

### Facial Recognition
