# openapi.model.AssetResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**checksum** | **String** | Base64 encoded SHA1 hash | 
**createdAt** | [**DateTime**](DateTime.md) | The UTC timestamp when the asset was originally uploaded to Immich. | 
**duplicateId** | **Optional<String?>** | Duplicate group ID | [optional] 
**duration** | **int** | Video/gif duration in milliseconds (null for static images) | 
**exifInfo** | [**Optional<ExifResponseDto?>**](ExifResponseDto.md) |  | [optional] 
**fileCreatedAt** | [**DateTime**](DateTime.md) | The actual UTC timestamp when the file was created/captured, preserving timezone information. This is the authoritative timestamp for chronological sorting within timeline groups. Combined with timezone data, this can be used to determine the exact moment the photo was taken. | 
**fileModifiedAt** | [**DateTime**](DateTime.md) | The UTC timestamp when the file was last modified on the filesystem. This reflects the last time the physical file was changed, which may be different from when the photo was originally taken. | 
**hasMetadata** | **bool** | Whether asset has metadata | 
**height** | **int** | Asset height | 
**id** | **String** | Asset ID | 
**isArchived** | **bool** | Is archived | 
**isEdited** | **bool** | Is edited | 
**isFavorite** | **bool** | Is favorite | 
**isOffline** | **bool** | Is offline | 
**isTrashed** | **bool** | Is trashed | 
**libraryId** | **Optional<String?>** | Library ID | [optional] 
**livePhotoVideoId** | **Optional<String?>** | Live photo video ID | [optional] 
**localDateTime** | [**DateTime**](DateTime.md) | The local date and time when the photo/video was taken, derived from EXIF metadata. This represents the photographer's local time regardless of timezone, stored as a timezone-agnostic timestamp. Used for timeline grouping by \"local\" days and months. | 
**originalFileName** | **String** | Original file name | 
**originalMimeType** | **Optional<String?>** | Original MIME type | [optional] 
**originalPath** | **String** | Original file path | 
**owner** | [**Optional<UserResponseDto?>**](UserResponseDto.md) |  | [optional] 
**ownerId** | **String** | Owner user ID | 
**people** | [**Optional<List<PersonResponseDto>?>**](PersonResponseDto.md) |  | [optional] [default to const []]
**resized** | **Optional<bool?>** | Is resized | [optional] 
**stack** | [**Optional<AssetStackResponseDto?>**](AssetStackResponseDto.md) |  | [optional] 
**tags** | [**Optional<List<TagResponseDto>?>**](TagResponseDto.md) |  | [optional] [default to const []]
**thumbhash** | **String** | Thumbhash for thumbnail generation (base64) also used as the c query param for thumbnail cache busting. | 
**type** | [**AssetTypeEnum**](AssetTypeEnum.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) | The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified. | 
**visibility** | [**AssetVisibility**](AssetVisibility.md) |  | 
**width** | **int** | Asset width | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


