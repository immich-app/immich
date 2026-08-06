# openapi.model.ServerStatsResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**photos** | **int** | Total number of photos | 
**usage** | **int** | Total storage usage in bytes | 
**usageByUser** | [**List<UsageByUserDto>**](UsageByUserDto.md) | Array of usage for each user | [default to const []]
**usagePhotos** | **int** | Storage usage for photos in bytes | 
**usageVideos** | **int** | Storage usage for videos in bytes | 
**videos** | **int** | Total number of videos | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


