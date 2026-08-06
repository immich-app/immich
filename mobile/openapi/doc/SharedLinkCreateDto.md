# openapi.model.SharedLinkCreateDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**albumId** | **Optional<String?>** | Album ID (for album sharing) | [optional] 
**allowDownload** | **Optional<bool?>** | Allow downloads | [optional] [default to true]
**allowUpload** | **Optional<bool?>** | Allow uploads | [optional] 
**assetIds** | **Optional<List<String>?>** | Asset IDs (for individual assets) | [optional] [default to const []]
**description** | **Optional<String?>** | Link description | [optional] 
**expiresAt** | [**Optional<DateTime?>**](DateTime.md) | Expiration date | [optional] 
**password** | **Optional<String?>** | Link password | [optional] 
**showMetadata** | **Optional<bool?>** | Show metadata | [optional] [default to true]
**slug** | **Optional<String?>** | Custom URL slug | [optional] 
**type** | [**SharedLinkType**](SharedLinkType.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


