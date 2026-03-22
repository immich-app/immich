# Profile Image S3 Upload — Design

## Problem

When `IMMICH_STORAGE_BACKEND=s3`, new uploads (originals, thumbnails, encoded videos, person thumbnails) are written to S3 with relative paths. However, profile images (both user-uploaded and OAuth-synced) are always written to local disk with absolute paths. This means profile images never land in S3, even when S3 is the configured write backend.

## Approach

Mirror the existing `persistFile()` pattern from `media.service.ts`: after writing the file to disk (which already happens), check if the write backend is S3, and if so, upload the file, update the DB path to the relative key, and delete the local temp file. Two call sites need fixing:

1. `user.service.ts:createProfileImage` — user-uploaded profile images
2. `auth.service.ts:syncProfilePicture` — OAuth provider profile pictures

A new `StorageCore.getRelativeProfileImagePath()` static method generates S3 keys following the existing nested path convention (`profile/{userId}/{ab}/{cd}/{uuid}.ext`).
