# openapi.model.AssetBulkUploadCheckResult

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**action** | [**AssetUploadAction**](AssetUploadAction.md) |  | 
**assetId** | **Optional<String?>** | Existing asset ID if duplicate | [optional] 
**id** | **String** | Client-side identifier echoed from the request to match results to inputs | 
**isTrashed** | **Optional<bool?>** | Whether existing asset is trashed | [optional] 
**reason** | [**Optional<AssetRejectReason?>**](AssetRejectReason.md) |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


