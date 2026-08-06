# openapi.model.MetadataSearchDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**albumIds** | **Optional<List<String>?>** | Filter by album IDs | [optional] [default to const []]
**checksum** | **Optional<String?>** | Filter by file checksum | [optional] 
**city** | **Optional<String?>** | Filter by city name | [optional] 
**country** | **Optional<String?>** | Filter by country name | [optional] 
**createdAfter** | [**Optional<DateTime?>**](DateTime.md) | Filter by creation date (after) | [optional] 
**createdBefore** | [**Optional<DateTime?>**](DateTime.md) | Filter by creation date (before) | [optional] 
**description** | **Optional<String?>** | Filter by description text | [optional] 
**encodedVideoPath** | **Optional<String?>** | Filter by encoded video file path | [optional] 
**id** | **Optional<String?>** | Filter by asset ID | [optional] 
**isEncoded** | **Optional<bool?>** | Filter by encoded status | [optional] 
**isFavorite** | **Optional<bool?>** | Filter by favorite status | [optional] 
**isMotion** | **Optional<bool?>** | Filter by motion photo status | [optional] 
**isNotInAlbum** | **Optional<bool?>** | Filter assets not in any album | [optional] 
**isOffline** | **Optional<bool?>** | Filter by offline status | [optional] 
**lensModel** | **Optional<String?>** | Filter by lens model | [optional] 
**libraryId** | **Optional<String?>** | Library ID to filter by | [optional] 
**make** | **Optional<String?>** | Filter by camera make | [optional] 
**model** | **Optional<String?>** | Filter by camera model | [optional] 
**ocr** | **Optional<String?>** | Filter by OCR text content | [optional] 
**order** | [**Optional<AssetOrder?>**](AssetOrder.md) |  | [optional] 
**originalFileName** | **Optional<String?>** | Filter by original file name | [optional] 
**originalPath** | **Optional<String?>** | Filter by original file path | [optional] 
**page** | **Optional<int?>** | Page number | [optional] 
**personIds** | **Optional<List<String>?>** | Filter by person IDs | [optional] [default to const []]
**previewPath** | **Optional<String?>** | Filter by preview file path | [optional] 
**rating** | **Optional<int?>** | Filter by rating [1-5], or null for unrated | [optional] 
**size** | **Optional<int?>** | Number of results to return | [optional] 
**state** | **Optional<String?>** | Filter by state/province name | [optional] 
**tagIds** | **Optional<List<String>?>** | Filter by tag IDs | [optional] [default to const []]
**takenAfter** | [**Optional<DateTime?>**](DateTime.md) | Filter by taken date (after) | [optional] 
**takenBefore** | [**Optional<DateTime?>**](DateTime.md) | Filter by taken date (before) | [optional] 
**thumbnailPath** | **Optional<String?>** | Filter by thumbnail file path | [optional] 
**trashedAfter** | [**Optional<DateTime?>**](DateTime.md) | Filter by trash date (after) | [optional] 
**trashedBefore** | [**Optional<DateTime?>**](DateTime.md) | Filter by trash date (before) | [optional] 
**type** | [**Optional<AssetTypeEnum?>**](AssetTypeEnum.md) |  | [optional] 
**updatedAfter** | [**Optional<DateTime?>**](DateTime.md) | Filter by update date (after) | [optional] 
**updatedBefore** | [**Optional<DateTime?>**](DateTime.md) | Filter by update date (before) | [optional] 
**visibility** | [**Optional<AssetVisibility?>**](AssetVisibility.md) |  | [optional] 
**withDeleted** | **Optional<bool?>** | Include deleted assets | [optional] 
**withExif** | **Optional<bool?>** | Include EXIF data in response | [optional] 
**withPeople** | **Optional<bool?>** | Include people data in response | [optional] 
**withStacked** | **Optional<bool?>** | Include stacked assets | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


