# openapi.api.AssetApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**checkDuplicateAsset**](AssetApi.md#checkduplicateasset) | **POST** /asset/check | 
[**deleteAsset**](AssetApi.md#deleteasset) | **DELETE** /asset | 
[**downloadFile**](AssetApi.md#downloadfile) | **GET** /asset/download | 
[**getAllAssets**](AssetApi.md#getallassets) | **GET** /asset | 
[**getAssetById**](AssetApi.md#getassetbyid) | **GET** /asset/assetById/{assetId} | 
[**getAssetSearchTerms**](AssetApi.md#getassetsearchterms) | **GET** /asset/searchTerm | 
[**getAssetThumbnail**](AssetApi.md#getassetthumbnail) | **GET** /asset/thumbnail/{assetId} | 
[**getCuratedLocations**](AssetApi.md#getcuratedlocations) | **GET** /asset/allLocation | 
[**getCuratedObjects**](AssetApi.md#getcuratedobjects) | **GET** /asset/allObjects | 
[**getUserAssetsByDeviceId**](AssetApi.md#getuserassetsbydeviceid) | **GET** /asset/{deviceId} | 
[**searchAsset**](AssetApi.md#searchasset) | **POST** /asset/search | 
[**serveFile**](AssetApi.md#servefile) | **GET** /asset/file | 
[**uploadFile**](AssetApi.md#uploadfile) | **POST** /asset/upload | 


# **checkDuplicateAsset**
> CheckDuplicateAssetResponseDto checkDuplicateAsset(checkDuplicateAssetDto)



Check duplicated asset before uploading - for Web upload used

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final checkDuplicateAssetDto = CheckDuplicateAssetDto(); // CheckDuplicateAssetDto | 

try {
    final result = api_instance.checkDuplicateAsset(checkDuplicateAssetDto);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->checkDuplicateAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **checkDuplicateAssetDto** | [**CheckDuplicateAssetDto**](CheckDuplicateAssetDto.md)|  | 

### Return type

[**CheckDuplicateAssetResponseDto**](CheckDuplicateAssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteAsset**
> List<DeleteAssetResponseDto> deleteAsset(deleteAssetDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final deleteAssetDto = DeleteAssetDto(); // DeleteAssetDto | 

try {
    final result = api_instance.deleteAsset(deleteAssetDto);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->deleteAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deleteAssetDto** | [**DeleteAssetDto**](DeleteAssetDto.md)|  | 

### Return type

[**List<DeleteAssetResponseDto>**](DeleteAssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **downloadFile**
> Object downloadFile(aid, did, isThumb, isWeb)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final aid = aid_example; // String | 
final did = did_example; // String | 
final isThumb = true; // bool | 
final isWeb = true; // bool | 

try {
    final result = api_instance.downloadFile(aid, did, isThumb, isWeb);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->downloadFile: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **aid** | **String**|  | 
 **did** | **String**|  | 
 **isThumb** | **bool**|  | [optional] 
 **isWeb** | **bool**|  | [optional] 

### Return type

[**Object**](Object.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAllAssets**
> List<AssetResponseDto> getAllAssets()



Get all AssetEntity belong to the user

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();

try {
    final result = api_instance.getAllAssets();
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->getAllAssets: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAssetById**
> AssetResponseDto getAssetById(assetId)



Get a single asset's information

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final assetId = assetId_example; // String | 

try {
    final result = api_instance.getAssetById(assetId);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->getAssetById: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 

### Return type

[**AssetResponseDto**](AssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAssetSearchTerms**
> List<String> getAssetSearchTerms()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();

try {
    final result = api_instance.getAssetSearchTerms();
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->getAssetSearchTerms: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

**List<String>**

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAssetThumbnail**
> Object getAssetThumbnail(assetId)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final assetId = assetId_example; // String | 

try {
    final result = api_instance.getAssetThumbnail(assetId);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->getAssetThumbnail: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetId** | **String**|  | 

### Return type

[**Object**](Object.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCuratedLocations**
> List<CuratedLocationsResponseDto> getCuratedLocations()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();

try {
    final result = api_instance.getCuratedLocations();
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->getCuratedLocations: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<CuratedLocationsResponseDto>**](CuratedLocationsResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCuratedObjects**
> List<CuratedObjectsResponseDto> getCuratedObjects()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();

try {
    final result = api_instance.getCuratedObjects();
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->getCuratedObjects: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<CuratedObjectsResponseDto>**](CuratedObjectsResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getUserAssetsByDeviceId**
> List<String> getUserAssetsByDeviceId(deviceId)



Get all asset of a device that are in the database, ID only.

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final deviceId = deviceId_example; // String | 

try {
    final result = api_instance.getUserAssetsByDeviceId(deviceId);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->getUserAssetsByDeviceId: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **deviceId** | **String**|  | 

### Return type

**List<String>**

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchAsset**
> List<AssetResponseDto> searchAsset(searchAssetDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final searchAssetDto = SearchAssetDto(); // SearchAssetDto | 

try {
    final result = api_instance.searchAsset(searchAssetDto);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->searchAsset: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **searchAssetDto** | [**SearchAssetDto**](SearchAssetDto.md)|  | 

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **serveFile**
> Object serveFile(aid, did, isThumb, isWeb)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final aid = aid_example; // String | 
final did = did_example; // String | 
final isThumb = true; // bool | 
final isWeb = true; // bool | 

try {
    final result = api_instance.serveFile(aid, did, isThumb, isWeb);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->serveFile: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **aid** | **String**|  | 
 **did** | **String**|  | 
 **isThumb** | **bool**|  | [optional] 
 **isWeb** | **bool**|  | [optional] 

### Return type

[**Object**](Object.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **uploadFile**
> AssetFileUploadResponseDto uploadFile(assetData)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AssetApi();
final assetData = BINARY_DATA_HERE; // MultipartFile | 

try {
    final result = api_instance.uploadFile(assetData);
    print(result);
} catch (e) {
    print('Exception when calling AssetApi->uploadFile: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetData** | **MultipartFile**|  | 

### Return type

[**AssetFileUploadResponseDto**](AssetFileUploadResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

