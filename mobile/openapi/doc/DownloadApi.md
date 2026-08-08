# openapi.api.DownloadApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**downloadArchive**](DownloadApi.md#downloadarchive) | **POST** /download/archive | Download asset archive
[**getDownloadInfo**](DownloadApi.md#getdownloadinfo) | **POST** /download/info | Retrieve download information


# **downloadArchive**
> MultipartFile downloadArchive(downloadArchiveDto, key, slug)

Download asset archive

Download a ZIP archive containing the specified assets. The assets must have been previously requested via the \"getDownloadInfo\" endpoint.

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

final api_instance = DownloadApi();
final downloadArchiveDto = DownloadArchiveDto(); // DownloadArchiveDto | 
final key = key_example; // String | 
final slug = slug_example; // String | 

try {
    final result = api_instance.downloadArchive(downloadArchiveDto, key, slug);
    print(result);
} catch (e) {
    print('Exception when calling DownloadApi->downloadArchive: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **downloadArchiveDto** | [**DownloadArchiveDto**](DownloadArchiveDto.md)|  | 
 **key** | **String**|  | [optional] 
 **slug** | **String**|  | [optional] 

### Return type

[**MultipartFile**](MultipartFile.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/octet-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getDownloadInfo**
> DownloadResponseDto getDownloadInfo(downloadInfoDto, key, slug)

Retrieve download information

Retrieve information about how to request a download for the specified assets or album. The response includes groups of assets that can be downloaded together.

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

final api_instance = DownloadApi();
final downloadInfoDto = DownloadInfoDto(); // DownloadInfoDto | 
final key = key_example; // String | 
final slug = slug_example; // String | 

try {
    final result = api_instance.getDownloadInfo(downloadInfoDto, key, slug);
    print(result);
} catch (e) {
    print('Exception when calling DownloadApi->getDownloadInfo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **downloadInfoDto** | [**DownloadInfoDto**](DownloadInfoDto.md)|  | 
 **key** | **String**|  | [optional] 
 **slug** | **String**|  | [optional] 

### Return type

[**DownloadResponseDto**](DownloadResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

