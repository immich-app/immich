# openapi.api.SearchApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getExploreData**](SearchApi.md#getexploredata) | **GET** /search/explore | 
[**getSearchConfig**](SearchApi.md#getsearchconfig) | **GET** /search/config | 
[**search**](SearchApi.md#search) | **GET** /search | 


# **getExploreData**
> List<SearchExploreResponseDto> getExploreData()



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

final api_instance = SearchApi();

try {
    final result = api_instance.getExploreData();
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->getExploreData: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<SearchExploreResponseDto>**](SearchExploreResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSearchConfig**
> SearchConfigResponseDto getSearchConfig()



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

final api_instance = SearchApi();

try {
    final result = api_instance.getSearchConfig();
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->getSearchConfig: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**SearchConfigResponseDto**](SearchConfigResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **search**
> SearchResponseDto search(q, query, clip, type, isFavorite, isArchived, exifInfoPeriodCity, exifInfoPeriodState, exifInfoPeriodCountry, exifInfoPeriodMake, exifInfoPeriodModel, exifInfoPeriodProjectionType, smartInfoPeriodObjects, smartInfoPeriodTags, recent, motion)



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

final api_instance = SearchApi();
final q = q_example; // String | 
final query = query_example; // String | 
final clip = true; // bool | 
final type = type_example; // String | 
final isFavorite = true; // bool | 
final isArchived = true; // bool | 
final exifInfoPeriodCity = exifInfoPeriodCity_example; // String | 
final exifInfoPeriodState = exifInfoPeriodState_example; // String | 
final exifInfoPeriodCountry = exifInfoPeriodCountry_example; // String | 
final exifInfoPeriodMake = exifInfoPeriodMake_example; // String | 
final exifInfoPeriodModel = exifInfoPeriodModel_example; // String | 
final exifInfoPeriodProjectionType = exifInfoPeriodProjectionType_example; // String | 
final smartInfoPeriodObjects = []; // List<String> | 
final smartInfoPeriodTags = []; // List<String> | 
final recent = true; // bool | 
final motion = true; // bool | 

try {
    final result = api_instance.search(q, query, clip, type, isFavorite, isArchived, exifInfoPeriodCity, exifInfoPeriodState, exifInfoPeriodCountry, exifInfoPeriodMake, exifInfoPeriodModel, exifInfoPeriodProjectionType, smartInfoPeriodObjects, smartInfoPeriodTags, recent, motion);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->search: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **q** | **String**|  | [optional] 
 **query** | **String**|  | [optional] 
 **clip** | **bool**|  | [optional] 
 **type** | **String**|  | [optional] 
 **isFavorite** | **bool**|  | [optional] 
 **isArchived** | **bool**|  | [optional] 
 **exifInfoPeriodCity** | **String**|  | [optional] 
 **exifInfoPeriodState** | **String**|  | [optional] 
 **exifInfoPeriodCountry** | **String**|  | [optional] 
 **exifInfoPeriodMake** | **String**|  | [optional] 
 **exifInfoPeriodModel** | **String**|  | [optional] 
 **exifInfoPeriodProjectionType** | **String**|  | [optional] 
 **smartInfoPeriodObjects** | [**List<String>**](String.md)|  | [optional] [default to const []]
 **smartInfoPeriodTags** | [**List<String>**](String.md)|  | [optional] [default to const []]
 **recent** | **bool**|  | [optional] 
 **motion** | **bool**|  | [optional] 

### Return type

[**SearchResponseDto**](SearchResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

