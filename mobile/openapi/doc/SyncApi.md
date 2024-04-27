# openapi.api.SyncApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAllForUserFullSync**](SyncApi.md#getallforuserfullsync) | **GET** /sync/full-sync | 
[**getDeltaSync**](SyncApi.md#getdeltasync) | **GET** /sync/delta-sync | 


# **getAllForUserFullSync**
> List<AssetResponseDto> getAllForUserFullSync(limit, updatedUntil, lastCreationDate, lastId, userId)



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

final api_instance = SyncApi();
final limit = 56; // int | 
final updatedUntil = 2013-10-20T19:20:30+01:00; // DateTime | 
final lastCreationDate = 2013-10-20T19:20:30+01:00; // DateTime | 
final lastId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final result = api_instance.getAllForUserFullSync(limit, updatedUntil, lastCreationDate, lastId, userId);
    print(result);
} catch (e) {
    print('Exception when calling SyncApi->getAllForUserFullSync: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | 
 **updatedUntil** | **DateTime**|  | 
 **lastCreationDate** | **DateTime**|  | [optional] 
 **lastId** | **String**|  | [optional] 
 **userId** | **String**|  | [optional] 

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getDeltaSync**
> AssetDeltaSyncResponseDto getDeltaSync(updatedAfter, userIds)



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

final api_instance = SyncApi();
final updatedAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final userIds = []; // List<String> | 

try {
    final result = api_instance.getDeltaSync(updatedAfter, userIds);
    print(result);
} catch (e) {
    print('Exception when calling SyncApi->getDeltaSync: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updatedAfter** | **DateTime**|  | 
 **userIds** | [**List<String>**](String.md)|  | [default to const []]

### Return type

[**AssetDeltaSyncResponseDto**](AssetDeltaSyncResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

