# openapi.model.AssetResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**checksum** | **String** | base64 encoded sha1 hash | 
**deviceAssetId** | **String** |  | 
**deviceId** | **String** |  | 
**duplicateId** | **String** |  | [optional] 
**duration** | **String** |  | 
**exifInfo** | [**ExifResponseDto**](ExifResponseDto.md) |  | [optional] 
**fileCreatedAt** | [**DateTime**](DateTime.md) |  | 
**fileModifiedAt** | [**DateTime**](DateTime.md) |  | 
**hasMetadata** | **bool** |  | 
**id** | **String** |  | 
**isArchived** | **bool** |  | 
**isExternal** | **bool** | This property was deprecated in v1.104.0 | [optional] 
**isFavorite** | **bool** |  | 
**isOffline** | **bool** |  | 
**isReadOnly** | **bool** | This property was deprecated in v1.104.0 | [optional] 
**isTrashed** | **bool** |  | 
**libraryId** | **String** |  | 
**livePhotoVideoId** | **String** |  | [optional] 
**localDateTime** | [**DateTime**](DateTime.md) |  | 
**originalFileName** | **String** |  | 
**originalPath** | **String** |  | 
**owner** | [**UserResponseDto**](UserResponseDto.md) |  | [optional] 
**ownerId** | **String** |  | 
**people** | [**List<PersonWithFacesResponseDto>**](PersonWithFacesResponseDto.md) |  | [optional] [default to const []]
**resized** | **bool** |  | 
**smartInfo** | [**SmartInfoResponseDto**](SmartInfoResponseDto.md) |  | [optional] 
**stack** | [**List<AssetResponseDto>**](AssetResponseDto.md) |  | [optional] [default to const []]
**stackCount** | **int** |  | 
**stackParentId** | **String** |  | [optional] 
**tags** | [**List<TagResponseDto>**](TagResponseDto.md) |  | [optional] [default to const []]
**thumbhash** | **String** |  | 
**type** | [**AssetTypeEnum**](AssetTypeEnum.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


