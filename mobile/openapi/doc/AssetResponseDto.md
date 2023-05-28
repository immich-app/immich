# openapi.model.AssetResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | [**AssetTypeEnum**](AssetTypeEnum.md) |  | 
**id** | **String** |  | 
**deviceAssetId** | **String** |  | 
**ownerId** | **String** |  | 
**deviceId** | **String** |  | 
**originalPath** | **String** |  | 
**originalFileName** | **String** |  | 
**resized** | **bool** |  | 
**fileCreatedAt** | **String** |  | 
**fileModifiedAt** | **String** |  | 
**updatedAt** | **String** |  | 
**isFavorite** | **bool** |  | 
**isArchived** | **bool** |  | 
**mimeType** | **String** |  | 
**duration** | **String** |  | 
**exifInfo** | [**ExifResponseDto**](ExifResponseDto.md) |  | [optional] 
**smartInfo** | [**SmartInfoResponseDto**](SmartInfoResponseDto.md) |  | [optional] 
**livePhotoVideoId** | **String** |  | [optional] 
**tags** | [**List<TagResponseDto>**](TagResponseDto.md) |  | [optional] [default to const []]
**people** | [**List<PersonResponseDto>**](PersonResponseDto.md) |  | [optional] [default to const []]
**checksum** | **String** | base64 encoded sha1 hash | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


