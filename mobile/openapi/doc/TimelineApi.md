# openapi.api.TimelineApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getTimeBucket**](TimelineApi.md#gettimebucket) | **GET** /timeline/bucket | 
[**getTimeBuckets**](TimelineApi.md#gettimebuckets) | **GET** /timeline/buckets | 


# **getTimeBucket**
> List<AssetResponseDto> getTimeBucket(size, timeBucket, albumId, isArchived, isFavorite, isTrashed, key, order, personId, userId, withPartners, withStacked)



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

final api_instance = TimelineApi();
final size = ; // TimeBucketSize | 
final timeBucket = timeBucket_example; // String | 
final albumId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final isArchived = true; // bool | 
final isFavorite = true; // bool | 
final isTrashed = true; // bool | 
final key = key_example; // String | 
final order = ; // AssetOrder | 
final personId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final withPartners = true; // bool | 
final withStacked = true; // bool | 

try {
    final result = api_instance.getTimeBucket(size, timeBucket, albumId, isArchived, isFavorite, isTrashed, key, order, personId, userId, withPartners, withStacked);
    print(result);
} catch (e) {
    print('Exception when calling TimelineApi->getTimeBucket: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **size** | [**TimeBucketSize**](.md)|  | 
 **timeBucket** | **String**|  | 
 **albumId** | **String**|  | [optional] 
 **isArchived** | **bool**|  | [optional] 
 **isFavorite** | **bool**|  | [optional] 
 **isTrashed** | **bool**|  | [optional] 
 **key** | **String**|  | [optional] 
 **order** | [**AssetOrder**](.md)|  | [optional] 
 **personId** | **String**|  | [optional] 
 **userId** | **String**|  | [optional] 
 **withPartners** | **bool**|  | [optional] 
 **withStacked** | **bool**|  | [optional] 

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getTimeBuckets**
> List<TimeBucketResponseDto> getTimeBuckets(size, albumId, isArchived, isFavorite, isTrashed, key, order, personId, userId, withPartners, withStacked)



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

final api_instance = TimelineApi();
final size = ; // TimeBucketSize | 
final albumId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final isArchived = true; // bool | 
final isFavorite = true; // bool | 
final isTrashed = true; // bool | 
final key = key_example; // String | 
final order = ; // AssetOrder | 
final personId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final userId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final withPartners = true; // bool | 
final withStacked = true; // bool | 

try {
    final result = api_instance.getTimeBuckets(size, albumId, isArchived, isFavorite, isTrashed, key, order, personId, userId, withPartners, withStacked);
    print(result);
} catch (e) {
    print('Exception when calling TimelineApi->getTimeBuckets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **size** | [**TimeBucketSize**](.md)|  | 
 **albumId** | **String**|  | [optional] 
 **isArchived** | **bool**|  | [optional] 
 **isFavorite** | **bool**|  | [optional] 
 **isTrashed** | **bool**|  | [optional] 
 **key** | **String**|  | [optional] 
 **order** | [**AssetOrder**](.md)|  | [optional] 
 **personId** | **String**|  | [optional] 
 **userId** | **String**|  | [optional] 
 **withPartners** | **bool**|  | [optional] 
 **withStacked** | **bool**|  | [optional] 

### Return type

[**List<TimeBucketResponseDto>**](TimeBucketResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

