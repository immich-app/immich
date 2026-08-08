# openapi.model.TimeBucketAssetResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**city** | **Optional<List<String?>?>** | Array of city names extracted from EXIF GPS data | [optional] [default to const []]
**country** | **Optional<List<String?>?>** | Array of country names extracted from EXIF GPS data | [optional] [default to const []]
**createdAt** | **List<String>** | Array of UTC timestamps when each asset was originally uploaded to Immich | [default to const []]
**duration** | **List<int?>** | Array of video/gif durations in milliseconds (null for static images) | [default to const []]
**fileCreatedAt** | **List<String>** | Array of file creation timestamps in UTC | [default to const []]
**id** | **List<String>** | Array of asset IDs in the time bucket | [default to const []]
**isFavorite** | **List<bool>** | Array indicating whether each asset is favorited | [default to const []]
**isImage** | **List<bool>** | Array indicating whether each asset is an image (false for videos) | [default to const []]
**isTrashed** | **List<bool>** | Array indicating whether each asset is in the trash | [default to const []]
**latitude** | **Optional<List<num?>?>** | Array of latitude coordinates extracted from EXIF GPS data | [optional] [default to const []]
**livePhotoVideoId** | **List<String?>** | Array of live photo video asset IDs (null for non-live photos) | [default to const []]
**localOffsetHours** | **List<num>** | Array of UTC offset hours at the time each photo was taken. Positive values are east of UTC, negative values are west of UTC. Values may be fractional (e.g., 5.5 for +05:30, -9.75 for -09:45). Applying this offset to 'fileCreatedAt' will give you the time the photo was taken from the photographer's perspective. | [default to const []]
**longitude** | **Optional<List<num?>?>** | Array of longitude coordinates extracted from EXIF GPS data | [optional] [default to const []]
**ownerId** | **List<String>** | Array of owner IDs for each asset | [default to const []]
**projectionType** | **List<String?>** | Array of projection types for 360° content (e.g., \"EQUIRECTANGULAR\", \"CUBEFACE\", \"CYLINDRICAL\") | [default to const []]
**ratio** | **List<num>** | Array of aspect ratios (width/height) for each asset | [default to const []]
**stack** | [**Optional<List<List<String>?>?>**](List.md) | Array of stack information as [stackId, assetCount] tuples (null for non-stacked assets) | [optional] [default to const []]
**thumbhash** | **List<String?>** | Array of BlurHash strings for generating asset previews (base64 encoded) | [default to const []]
**visibility** | [**List<AssetVisibility>**](AssetVisibility.md) | Array of visibility statuses for each asset (e.g., ARCHIVE, TIMELINE, HIDDEN, LOCKED) | [default to const []]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


