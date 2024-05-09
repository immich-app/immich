# openapi.model.AlbumResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**albumName** | **String** |  | 
**albumThumbnailAssetId** | **String** |  | 
**albumUsers** | [**List<AlbumUserResponseDto>**](AlbumUserResponseDto.md) |  | [default to const []]
**assetCount** | **int** |  | 
**assets** | [**List<AssetResponseDto>**](AssetResponseDto.md) |  | [default to const []]
**createdAt** | [**DateTime**](DateTime.md) |  | 
**description** | **String** |  | 
**endDate** | [**DateTime**](DateTime.md) |  | [optional] 
**hasSharedLink** | **bool** |  | 
**id** | **String** |  | 
**isActivityEnabled** | **bool** |  | 
**lastModifiedAssetTimestamp** | [**DateTime**](DateTime.md) |  | [optional] 
**order** | [**AssetOrder**](AssetOrder.md) |  | [optional] 
**owner** | [**UserResponseDto**](UserResponseDto.md) |  | 
**ownerId** | **String** |  | 
**shared** | **bool** |  | 
**sharedUsers** | [**List<UserResponseDto>**](UserResponseDto.md) | This property was deprecated in v1.102.0 | [default to const []]
**startDate** | [**DateTime**](DateTime.md) |  | [optional] 
**updatedAt** | [**DateTime**](DateTime.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


