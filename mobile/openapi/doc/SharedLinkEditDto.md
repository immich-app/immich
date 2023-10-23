# openapi.model.SharedLinkEditDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**allowDownload** | **bool** |  | [optional] 
**allowUpload** | **bool** |  | [optional] 
**changeExpiryTime** | **bool** | Few clients cannot send null to set the expiryTime to never. Setting this flag and not sending expiryAt is considered as null instead. Clients that can send null values can ignore this. | [optional] 
**description** | **String** |  | [optional] 
**expiresAt** | [**DateTime**](DateTime.md) |  | [optional] 
**showMetadata** | **bool** |  | [optional] 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


