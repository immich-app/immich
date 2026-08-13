# openapi.model.AssetBulkUpdateDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**dateTimeOriginal** | **Optional<String?>** | Original date and time | [optional] 
**dateTimeRelative** | **Optional<int?>** | Relative time offset in minutes | [optional] 
**description** | **Optional<String?>** | Asset description | [optional] 
**duplicateId** | **Optional<String?>** | Duplicate ID | [optional] 
**ids** | **List<String>** | Asset IDs to update | [default to const []]
**isFavorite** | **Optional<bool?>** | Mark as favorite | [optional] 
**latitude** | **Optional<num?>** | Latitude coordinate | [optional] 
**longitude** | **Optional<num?>** | Longitude coordinate | [optional] 
**rating** | **Optional<int?>** | Rating in range [1-5] (starred), -1 (rejected), or null (unrated) | [optional] 
**timeZone** | **Optional<String?>** | Time zone (IANA timezone) | [optional] 
**visibility** | [**Optional<AssetVisibility?>**](AssetVisibility.md) |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


