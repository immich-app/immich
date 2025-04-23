# Jobs and Workers

## Workers

### Architecture

The `immich-server` container contains multiple workers:

- `api`: responds to API requests for data and files for the web and mobile app.
- `microservices`: handles most other work, such as thumbnail generation and video encoding, in the form of _jobs_. Simply put, a job is a request to process data in the background.

## Split workers

If you prefer to throttle or distribute the workers, you can do this using the [environment variables](/docs/install/environment-variables) to specify which container should pick up which tasks.

For example, for a simple setup with one container for the Web/API and one for all other microservices, you can do the following:

Copy the entire `immich-server` block as a new service and make the following changes to the **copy**:

```diff
- immich-server:
-   container_name: immich_server
...
-   ports:
-     - 2283:2283
+ immich-microservices:
+   container_name: immich_microservices
```

Once you have two copies of the immich-server service, make the following changes to each one. This will allow one container to only serve the web UI and API, and the other one to handle all other tasks.

```diff
services:
  immich-server:
    ...
+   environment:
+     IMMICH_WORKERS_INCLUDE: 'api'

  immich-microservices:
    ...
+   environment:
+     IMMICH_WORKERS_EXCLUDE: 'api'
```

## Configure Microservices to Process Specific Jobs

### Available Job Queues

Immich microservices handle various specialized job queues:

| Queue Name | Description |
|------------|-------------|
| `thumbnailGeneration` | Creates thumbnails for assets |
| `metadataExtraction` | Extracts EXIF and other metadata from assets |
| `videoConversion` | Transcodes videos to web-friendly formats |
| `faceDetection` | Detects faces in images |
| `facialRecognition` | Processes detected faces for recognition |
| `smartSearch` | Builds and maintains the smart search index |
| `duplicateDetection` | Identifies potential duplicate assets |
| `backgroundTask` | Handles general background tasks |
| `storageTemplateMigration` | Moves assets according to storage templates |
| `migration` | Handles database migrations |
| `search` | Processes search-related operations |
| `sidecar` | Processes sidecar files (XMP, etc.) |
| `library` | Manages library operations |
| `notifications` | Sends system and user notifications |
| `backupDatabase` | Handles database backup operations |

### Controlling Queue Processing

By default, a microservices worker will process all job queues. You can control which queues a worker processes using these environment variables:

- `IMMICH_MICROSERVICES_QUEUES_INCLUDE`: A comma-separated list of queue names that the worker should process.
- `IMMICH_MICROSERVICES_QUEUES_EXCLUDE`: A comma-separated list of queue names that the worker should NOT process.

The default setting processes all queues:

```bash
export IMMICH_MICROSERVICES_QUEUES_INCLUDE = "thumbnailGeneration,metadataExtraction,videoConversion,faceDetection,facialRecognition,smartSearch,duplicateDetection,backgroundTask,storageTemplateMigration,migration,search,sidecar,library,notifications,backupDatabase";
export IMMICH_MICROSERVICES_QUEUES_EXCLUDE = '';
```

### Example: Distributing Jobs Based on Hardware Capabilities

#### Main Server (Less Powerful CPU)

For a server with larger disk capacity but less powerful CPU:

```diff
services:
  immich-server:
    ...
    environment:
      IMMICH_WORKERS_INCLUDE: 'api'
  
  immich-microservices:
    ...
    environment:
      IMMICH_WORKERS_INCLUDE: 'microservices'
+     IMMICH_MICROSERVICES_QUEUES_EXCLUDE: 'videoConversion,thumbnailGeneration'
```

#### Dedicated Processing Server (More Powerful CPU)

For a separate server with better video processing capabilities:

```diff
services:
  immich-microservices:
    ...
    environment:
      IMMICH_WORKERS_INCLUDE: 'microservices'
+     IMMICH_MICROSERVICES_QUEUES_INCLUDE: 'videoConversion,thumbnailGeneration'
```

## Jobs

When a new asset is uploaded it kicks off a series of jobs, which include metadata extraction, thumbnail generation, machine learning tasks, and storage template migration, if enabled. To view the status of a job navigate to the Administration -> Jobs page.

Additionally, some jobs run on a schedule, which is every night at midnight. This schedule, with the exception of [External Libraries](/docs/features/libraries) scanning, cannot be changed.

<img src={require('./img/admin-jobs.webp').default} width="60%" title="Admin jobs" />
