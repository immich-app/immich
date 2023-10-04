# openapi.model.AssetEntity

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**albums** | [**List<AlbumEntity>**](AlbumEntity.md) |  | [optional] [default to const []]
**checksum** | [**Object**](.md) |  | 
**createdAt** | [**DateTime**](DateTime.md) |  | 
**deviceAssetId** | **String** |  | 
**deviceId** | **String** |  | 
**duration** | **String** |  | 
**encodedVideoPath** | **String** |  | 
**exifInfo** | [**ExifEntity**](ExifEntity.md) |  | [optional] 
**faces** | [**List<AssetFaceEntity>**](AssetFaceEntity.md) |  | [default to const []]
**fileCreatedAt** | [**DateTime**](DateTime.md) |  | 
**fileModifiedAt** | [**DateTime**](DateTime.md) |  | 
**id** | **String** |  | 
**isArchived** | **bool** |  | 
**isExternal** | **bool** |  | 
**isFavorite** | **bool** |  | 
**isOffline** | **bool** |  | 
**isReadOnly** | **bool** |  | 
**isVisible** | **bool** |  | 
**library_** | [**LibraryEntity**](LibraryEntity.md) |  | 
**libraryId** | **String** |  | 
**livePhotoVideo** | [**AssetEntity**](AssetEntity.md) |  | 
**livePhotoVideoId** | **String** |  | 
**originalFileName** | **String** |  | 
**originalPath** | **String** |  | 
**owner** | [**UserEntity**](UserEntity.md) |  | 
**ownerId** | **String** |  | 
**resizePath** | **String** |  | 
**sharedLinks** | [**List<SharedLinkEntity>**](SharedLinkEntity.md) |  | [default to const []]
**sidecarPath** | **String** |  | 
**smartInfo** | [**SmartInfoEntity**](SmartInfoEntity.md) |  | [optional] 
**tags** | [**List<TagEntity>**](TagEntity.md) |  | [default to const []]
**thumbhash** | [**Object**](.md) |  | 
**type** | **String** |  | 
**updatedAt** | [**DateTime**](DateTime.md) |  | 
**webpPath** | **String** |  | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


