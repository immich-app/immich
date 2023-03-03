# openapi.api.SearchApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getSearchConfig**](SearchApi.md#getsearchconfig) | **GET** /search/config | 
[**search**](SearchApi.md#search) | **GET** /search | 


# **getSearchConfig**
> SearchConfigResponseDto getSearchConfig()





### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';

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

[bearer](../README.md#bearer), [cookie](../README.md#cookie)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **search**
> SearchResponseDto search(query, type, isFavorite, exifInfoPeriodCity, exifInfoPeriodState, exifInfoPeriodCountry, exifInfoPeriodMake, exifInfoPeriodModel, smartInfoPeriodObjects, smartInfoPeriodTags)





### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';

final api_instance = SearchApi();
final query = query_example; // String | 
final type = type_example; // String | 
final isFavorite = true; // bool | 
final exifInfoPeriodCity = exifInfoPeriodCity_example; // String | 
final exifInfoPeriodState = exifInfoPeriodState_example; // String | 
final exifInfoPeriodCountry = exifInfoPeriodCountry_example; // String | 
final exifInfoPeriodMake = exifInfoPeriodMake_example; // String | 
final exifInfoPeriodModel = exifInfoPeriodModel_example; // String | 
final smartInfoPeriodObjects = []; // List<String> | 
final smartInfoPeriodTags = []; // List<String> | 

try {
    final result = api_instance.search(query, type, isFavorite, exifInfoPeriodCity, exifInfoPeriodState, exifInfoPeriodCountry, exifInfoPeriodMake, exifInfoPeriodModel, smartInfoPeriodObjects, smartInfoPeriodTags);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->search: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **query** | **String**|  | [optional] 
 **type** | **String**|  | [optional] 
 **isFavorite** | **bool**|  | [optional] 
 **exifInfoPeriodCity** | **String**|  | [optional] 
 **exifInfoPeriodState** | **String**|  | [optional] 
 **exifInfoPeriodCountry** | **String**|  | [optional] 
 **exifInfoPeriodMake** | **String**|  | [optional] 
 **exifInfoPeriodModel** | **String**|  | [optional] 
 **smartInfoPeriodObjects** | [**List<String>**](String.md)|  | [optional] [default to const []]
 **smartInfoPeriodTags** | [**List<String>**](String.md)|  | [optional] [default to const []]

### Return type

[**SearchResponseDto**](SearchResponseDto.md)

### Authorization

[bearer](../README.md#bearer), [cookie](../README.md#cookie)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

