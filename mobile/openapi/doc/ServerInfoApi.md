# openapi.api.ServerInfoApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getServerConfig**](ServerInfoApi.md#getserverconfig) | **GET** /server-info/config | 
[**getServerFeatures**](ServerInfoApi.md#getserverfeatures) | **GET** /server-info/features | 
[**getServerInfo**](ServerInfoApi.md#getserverinfo) | **GET** /server-info | 
[**getServerVersion**](ServerInfoApi.md#getserverversion) | **GET** /server-info/version | 
[**getStats**](ServerInfoApi.md#getstats) | **GET** /server-info/stats | 
[**getSupportedMediaTypes**](ServerInfoApi.md#getsupportedmediatypes) | **GET** /server-info/media-types | 
[**pingServer**](ServerInfoApi.md#pingserver) | **GET** /server-info/ping | 


# **getServerConfig**
> ServerConfigDto getServerConfig()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerInfoApi();

try {
    final result = api_instance.getServerConfig();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->getServerConfig: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerConfigDto**](ServerConfigDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerFeatures**
> ServerFeaturesDto getServerFeatures()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerInfoApi();

try {
    final result = api_instance.getServerFeatures();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->getServerFeatures: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerFeaturesDto**](ServerFeaturesDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerInfo**
> ServerInfoResponseDto getServerInfo()



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

final api_instance = ServerInfoApi();

try {
    final result = api_instance.getServerInfo();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->getServerInfo: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerInfoResponseDto**](ServerInfoResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerVersion**
> ServerVersionResponseDto getServerVersion()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerInfoApi();

try {
    final result = api_instance.getServerVersion();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->getServerVersion: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerVersionResponseDto**](ServerVersionResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getStats**
> ServerStatsResponseDto getStats()



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

final api_instance = ServerInfoApi();

try {
    final result = api_instance.getStats();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->getStats: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerStatsResponseDto**](ServerStatsResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSupportedMediaTypes**
> ServerMediaTypesResponseDto getSupportedMediaTypes()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerInfoApi();

try {
    final result = api_instance.getSupportedMediaTypes();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->getSupportedMediaTypes: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerMediaTypesResponseDto**](ServerMediaTypesResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **pingServer**
> ServerPingResponse pingServer()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerInfoApi();

try {
    final result = api_instance.pingServer();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->pingServer: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerPingResponse**](ServerPingResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

