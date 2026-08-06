# openapi.model.AlbumResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**albumName** | **String** | Album name | 
**albumThumbnailAssetId** | **String** | Thumbnail asset ID | 
**albumUsers** | [**List<AlbumUserResponseDto>**](AlbumUserResponseDto.md) | First entry is always the album owner. Second entry is the auth user, if it differs from the owner. The rest are ordered alphabetically. | [default to const []]
**assetCount** | **int** | Number of assets | 
**contributorCounts** | [**Optional<List<ContributorCountResponseDto>?>**](ContributorCountResponseDto.md) |  | [optional] [default to const []]
**createdAt** | [**DateTime**](DateTime.md) | Creation date | 
**description** | **String** | Album description | 
**endDate** | [**Optional<DateTime?>**](DateTime.md) | End date (latest asset) | [optional] 
**hasSharedLink** | **bool** | Has shared link | 
**id** | **String** | Album ID | 
**isActivityEnabled** | **bool** | Activity feed enabled | 
**lastModifiedAssetTimestamp** | [**Optional<DateTime?>**](DateTime.md) | Last modified asset timestamp | [optional] 
**order** | [**Optional<AssetOrder?>**](AssetOrder.md) |  | [optional] 
**shared** | **bool** | Is shared album | 
**startDate** | [**Optional<DateTime?>**](DateTime.md) | Start date (earliest asset) | [optional] 
**updatedAt** | [**DateTime**](DateTime.md) | Last update date | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


