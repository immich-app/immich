#!/usr/bin/env bash
export IMMICH_WORKERS_EXCLUDE=api

# Set queue filter based on Fly.io process group
case "$FLY_PROCESS_GROUP" in
  worker-video)
    export IMMICH_QUEUES_INCLUDE="videoConversion"
    ;;
  worker-thumb)
    export IMMICH_QUEUES_INCLUDE="assetThumbnailGeneration,personThumbnailGeneration"
    ;;
  worker-io)
    export IMMICH_QUEUES_INCLUDE="s3Upload,encryption,metadataExtraction,sidecar"
    ;;
  worker-general)
    export IMMICH_QUEUES_INCLUDE="backgroundTask,library,search,migration,workflow,notifications,backupDatabase,storageTemplateMigration"
    ;;
  # Default: process all queues (for local dev or legacy 'worker' group)
esac

exec start.sh "$@"
