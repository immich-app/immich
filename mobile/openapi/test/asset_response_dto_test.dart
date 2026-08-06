//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

import 'package:openapi/api.dart';
import 'package:test/test.dart';

// tests for AssetResponseDto
void main() {
  // final instance = AssetResponseDto();

  group('test AssetResponseDto', () {
    // Base64 encoded SHA1 hash
    // String checksum
    test('to test the property `checksum`', () async {
      // TODO
    });

    // The UTC timestamp when the asset was originally uploaded to Immich.
    // DateTime createdAt
    test('to test the property `createdAt`', () async {
      // TODO
    });

    // Duplicate group ID
    // Optional<String?> duplicateId
    test('to test the property `duplicateId`', () async {
      // TODO
    });

    // Video/gif duration in milliseconds (null for static images)
    // int duration
    test('to test the property `duration`', () async {
      // TODO
    });

    // Optional<ExifResponseDto?> exifInfo
    test('to test the property `exifInfo`', () async {
      // TODO
    });

    // The actual UTC timestamp when the file was created/captured, preserving timezone information. This is the authoritative timestamp for chronological sorting within timeline groups. Combined with timezone data, this can be used to determine the exact moment the photo was taken.
    // DateTime fileCreatedAt
    test('to test the property `fileCreatedAt`', () async {
      // TODO
    });

    // The UTC timestamp when the file was last modified on the filesystem. This reflects the last time the physical file was changed, which may be different from when the photo was originally taken.
    // DateTime fileModifiedAt
    test('to test the property `fileModifiedAt`', () async {
      // TODO
    });

    // Whether asset has metadata
    // bool hasMetadata
    test('to test the property `hasMetadata`', () async {
      // TODO
    });

    // Asset height
    // int height
    test('to test the property `height`', () async {
      // TODO
    });

    // Asset ID
    // String id
    test('to test the property `id`', () async {
      // TODO
    });

    // Is archived
    // bool isArchived
    test('to test the property `isArchived`', () async {
      // TODO
    });

    // Is edited
    // bool isEdited
    test('to test the property `isEdited`', () async {
      // TODO
    });

    // Is favorite
    // bool isFavorite
    test('to test the property `isFavorite`', () async {
      // TODO
    });

    // Is offline
    // bool isOffline
    test('to test the property `isOffline`', () async {
      // TODO
    });

    // Is trashed
    // bool isTrashed
    test('to test the property `isTrashed`', () async {
      // TODO
    });

    // Library ID
    // Optional<String?> libraryId
    test('to test the property `libraryId`', () async {
      // TODO
    });

    // Live photo video ID
    // Optional<String?> livePhotoVideoId
    test('to test the property `livePhotoVideoId`', () async {
      // TODO
    });

    // The local date and time when the photo/video was taken, derived from EXIF metadata. This represents the photographer's local time regardless of timezone, stored as a timezone-agnostic timestamp. Used for timeline grouping by \"local\" days and months.
    // DateTime localDateTime
    test('to test the property `localDateTime`', () async {
      // TODO
    });

    // Original file name
    // String originalFileName
    test('to test the property `originalFileName`', () async {
      // TODO
    });

    // Original MIME type
    // Optional<String?> originalMimeType
    test('to test the property `originalMimeType`', () async {
      // TODO
    });

    // Original file path
    // String originalPath
    test('to test the property `originalPath`', () async {
      // TODO
    });

    // Optional<UserResponseDto?> owner
    test('to test the property `owner`', () async {
      // TODO
    });

    // Owner user ID
    // String ownerId
    test('to test the property `ownerId`', () async {
      // TODO
    });

    // Optional<List<PersonResponseDto>?> people (default value: const [])
    test('to test the property `people`', () async {
      // TODO
    });

    // Is resized
    // Optional<bool?> resized
    test('to test the property `resized`', () async {
      // TODO
    });

    // Optional<AssetStackResponseDto?> stack
    test('to test the property `stack`', () async {
      // TODO
    });

    // Optional<List<TagResponseDto>?> tags (default value: const [])
    test('to test the property `tags`', () async {
      // TODO
    });

    // Thumbhash for thumbnail generation (base64) also used as the c query param for thumbnail cache busting.
    // String thumbhash
    test('to test the property `thumbhash`', () async {
      // TODO
    });

    // AssetTypeEnum type
    test('to test the property `type`', () async {
      // TODO
    });

    // The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified.
    // DateTime updatedAt
    test('to test the property `updatedAt`', () async {
      // TODO
    });

    // AssetVisibility visibility
    test('to test the property `visibility`', () async {
      // TODO
    });

    // Asset width
    // int width
    test('to test the property `width`', () async {
      // TODO
    });


  });

}
