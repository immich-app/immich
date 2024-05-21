# openapi.api.DeprecatedApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAssetThumbnail**](DeprecatedApi.md#getassetthumbnail) | **GET** /asset/thumbnail/{id} | 
[**serveFile**](DeprecatedApi.md#servefile) | **GET** /asset/file/{id} | 
[**uploadFile**](DeprecatedApi.md#uploadfile) | **POST** /asset/upload | 


# **getAssetThumbnail**
> MultipartFile getAssetThumbnail(id, format, key)



This property was deprecated in v1.106.0

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = DeprecatedApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final format = ; // ThumbnailFormat | 
final key = key_example; // String | 

try {
    final result = api_instance.getAssetThumbnail(id, format, key);
    print(result);
} catch (e) {
    print('Exception when calling DeprecatedApi->getAssetThumbnail: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **format** | [**ThumbnailFormat**](.md)|  | [optional] 
 **key** | **String**|  | [optional] 

### Return type

[**MultipartFile**](MultipartFile.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **serveFile**
> MultipartFile serveFile(id, isThumb, isWeb, key)



This property was deprecated in v1.106.0

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = DeprecatedApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final isThumb = true; // bool | 
final isWeb = true; // bool | 
final key = key_example; // String | 

try {
    final result = api_instance.serveFile(id, isThumb, isWeb, key);
    print(result);
} catch (e) {
    print('Exception when calling DeprecatedApi->serveFile: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **isThumb** | **bool**|  | [optional] 
 **isWeb** | **bool**|  | [optional] 
 **key** | **String**|  | [optional] 

### Return type

[**MultipartFile**](MultipartFile.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **uploadFile**
> AssetFileUploadResponseDto uploadFile(assetData, deviceAssetId, deviceId, fileCreatedAt, fileModifiedAt, key, xImmichChecksum, duration, isArchived, isFavorite, isOffline, isVisible, livePhotoData, sidecarData)



This property was deprecated in v1.106.0

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = DeprecatedApi();
final assetData = BINARY_DATA_HERE; // MultipartFile | 
final deviceAssetId = deviceAssetId_example; // String | 
final deviceId = deviceId_example; // String | 
final fileCreatedAt = 2013-10-20T19:20:30+01:00; // DateTime | 
final fileModifiedAt = 2013-10-20T19:20:30+01:00; // DateTime | 
final key = key_example; // String | 
final xImmichChecksum = xImmichChecksum_example; // String | sha1 checksum that can be used for duplicate detection before the file is uploaded
final duration = duration_example; // String | 
final isArchived = true; // bool | 
final isFavorite = true; // bool | 
final isOffline = true; // bool | 
final isVisible = true; // bool | 
final livePhotoData = BINARY_DATA_HERE; // MultipartFile | 
final sidecarData = BINARY_DATA_HERE; // MultipartFile | 

try {
    final result = api_instance.uploadFile(assetData, deviceAssetId, deviceId, fileCreatedAt, fileModifiedAt, key, xImmichChecksum, duration, isArchived, isFavorite, isOffline, isVisible, livePhotoData, sidecarData);
    print(result);
} catch (e) {
    print('Exception when calling DeprecatedApi->uploadFile: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **assetData** | **MultipartFile**|  | 
 **deviceAssetId** | **String**|  | 
 **deviceId** | **String**|  | 
 **fileCreatedAt** | **DateTime**|  | 
 **fileModifiedAt** | **DateTime**|  | 
 **key** | **String**|  | [optional] 
 **xImmichChecksum** | **String**| sha1 checksum that can be used for duplicate detection before the file is uploaded | [optional] 
 **duration** | **String**|  | [optional] 
 **isArchived** | **bool**|  | [optional] 
 **isFavorite** | **bool**|  | [optional] 
 **isOffline** | **bool**|  | [optional] 
 **isVisible** | **bool**|  | [optional] 
 **livePhotoData** | **MultipartFile**|  | [optional] 
 **sidecarData** | **MultipartFile**|  | [optional] 

### Return type

[**AssetFileUploadResponseDto**](AssetFileUploadResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

