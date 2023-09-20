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
**duration** | **String** |  | 
**exifInfo** | [**ExifResponseDto**](ExifResponseDto.md) |  | [optional] 
**fileCreatedAt** | [**DateTime**](DateTime.md) |  | 
**fileModifiedAt** | [**DateTime**](DateTime.md) |  | 
**id** | **String** |  | 
**isArchived** | **bool** |  | 
**isExternal** | **bool** |  | 
**isFavorite** | **bool** |  | 
**isOffline** | **bool** |  | 
**isReadOnly** | **bool** |  | 
**libraryId** | **String** |  | 
**livePhotoVideoId** | **String** |  | [optional] 
**originalFileName** | **String** |  | 
**originalPath** | **String** |  | 
**owner** | [**UserResponseDto**](UserResponseDto.md) |  | [optional] 
**ownerId** | **String** |  | 
**people** | [**List<PersonResponseDto>**](PersonResponseDto.md) |  | [optional] [default to const []]
**resized** | **bool** |  | 
**smartInfo** | [**SmartInfoResponseDto**](SmartInfoResponseDto.md) |  | [optional] 
**tags** | [**List<TagResponseDto>**](TagResponseDto.md) |  | [optional] [default to const []]
**thumbhash** | **String** | base64 encoded thumbhash | 
**type** | [**AssetTypeEnum**](AssetTypeEnum.md) |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


