# openapi.model.StatisticsSearchDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**albumIds** | **Optional<List<String>?>** | Filter by album IDs | [optional] [default to const []]
**city** | **Optional<String?>** | Filter by city name | [optional] 
**country** | **Optional<String?>** | Filter by country name | [optional] 
**createdAfter** | [**Optional<DateTime?>**](DateTime.md) | Filter by creation date (after) | [optional] 
**createdBefore** | [**Optional<DateTime?>**](DateTime.md) | Filter by creation date (before) | [optional] 
**description** | **Optional<String?>** | Filter by description text | [optional] 
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
**personIds** | **Optional<List<String>?>** | Filter by person IDs | [optional] [default to const []]
**rating** | **Optional<int?>** | Filter by rating [1-5], or null for unrated | [optional] 
**state** | **Optional<String?>** | Filter by state/province name | [optional] 
**tagIds** | **Optional<List<String>?>** | Filter by tag IDs | [optional] [default to const []]
**takenAfter** | [**Optional<DateTime?>**](DateTime.md) | Filter by taken date (after) | [optional] 
**takenBefore** | [**Optional<DateTime?>**](DateTime.md) | Filter by taken date (before) | [optional] 
**trashedAfter** | [**Optional<DateTime?>**](DateTime.md) | Filter by trash date (after) | [optional] 
**trashedBefore** | [**Optional<DateTime?>**](DateTime.md) | Filter by trash date (before) | [optional] 
**type** | [**Optional<AssetTypeEnum?>**](AssetTypeEnum.md) |  | [optional] 
**updatedAfter** | [**Optional<DateTime?>**](DateTime.md) | Filter by update date (after) | [optional] 
**updatedBefore** | [**Optional<DateTime?>**](DateTime.md) | Filter by update date (before) | [optional] 
**visibility** | [**Optional<AssetVisibility?>**](AssetVisibility.md) |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


