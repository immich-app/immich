# openapi.model.SyncAssetOcrV1

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**assetId** | **String** | Asset ID | 
**boxScore** | **double** | Confidence score of the bounding box | 
**id** | **String** | OCR entry ID | 
**isVisible** | **bool** | Whether the OCR entry is visible | 
**text** | **String** | Recognized text content | 
**textScore** | **double** | Confidence score of the recognized text | 
**x1** | **double** | Top-left X coordinate (normalized 0–1) | 
**x2** | **double** | Top-right X coordinate (normalized 0–1) | 
**x3** | **double** | Bottom-right X coordinate (normalized 0–1) | 
**x4** | **double** | Bottom-left X coordinate (normalized 0–1) | 
**y1** | **double** | Top-left Y coordinate (normalized 0–1) | 
**y2** | **double** | Top-right Y coordinate (normalized 0–1) | 
**y3** | **double** | Bottom-right Y coordinate (normalized 0–1) | 
**y4** | **double** | Bottom-left Y coordinate (normalized 0–1) | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


