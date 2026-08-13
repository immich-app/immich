# openapi.model.SearchAssetResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**count** | **int** | Number of assets in this page | 
**facets** | [**List<SearchFacetResponseDto>**](SearchFacetResponseDto.md) |  | [default to const []]
**items** | [**List<AssetResponseDto>**](AssetResponseDto.md) |  | [default to const []]
**nextPage** | **String** | Next page token | 
**total** | **int** | Total number of matching assets | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


