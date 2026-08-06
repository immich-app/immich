# openapi.model.SharedLinkResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**album** | [**Optional<AlbumResponseDto?>**](AlbumResponseDto.md) |  | [optional] 
**allowDownload** | **bool** | Allow downloads | 
**allowUpload** | **bool** | Allow uploads | 
**assets** | [**List<AssetResponseDto>**](AssetResponseDto.md) |  | [default to const []]
**createdAt** | [**DateTime**](DateTime.md) | Creation date | 
**description** | **String** | Link description | 
**expiresAt** | [**DateTime**](DateTime.md) | Expiration date | 
**id** | **String** | Shared link ID | 
**key** | **String** | Encryption key (base64url) | 
**password** | **String** | Has password | 
**showMetadata** | **bool** | Show metadata | 
**slug** | **String** | Custom URL slug | 
**type** | [**SharedLinkType**](SharedLinkType.md) |  | 
**userId** | **String** | Owner user ID | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


