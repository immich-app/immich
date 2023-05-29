# openapi.model.SharedLinkResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | [**SharedLinkType**](SharedLinkType.md) |  | 
**id** | **String** |  | 
**description** | **String** |  | [optional] 
**userId** | **String** |  | 
**key** | **String** |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**expiresAt** | [**DateTime**](DateTime.md) |  | 
**assets** | [**List<AssetResponseDto>**](AssetResponseDto.md) |  | [default to const []]
**album** | [**AlbumResponseDto**](AlbumResponseDto.md) |  | [optional] 
**allowUpload** | **bool** |  | 
**allowDownload** | **bool** |  | 
**showExif** | **bool** |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


