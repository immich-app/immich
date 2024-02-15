# openapi.api.SearchApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getExploreData**](SearchApi.md#getexploredata) | **GET** /search/explore | 
[**getSearchSuggestions**](SearchApi.md#getsearchsuggestions) | **GET** /search/suggestions | 
[**search**](SearchApi.md#search) | **GET** /search | 
[**searchMetadata**](SearchApi.md#searchmetadata) | **GET** /search/metadata | 
[**searchPerson**](SearchApi.md#searchperson) | **GET** /search/person | 
[**searchSmart**](SearchApi.md#searchsmart) | **GET** /search/smart | 


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

# **getSearchSuggestions**
> List<String> getSearchSuggestions(type, country, make, model, state)



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
final type = ; // SearchSuggestionType | 
final country = country_example; // String | 
final make = make_example; // String | 
final model = model_example; // String | 
final state = state_example; // String | 

try {
    final result = api_instance.getSearchSuggestions(type, country, make, model, state);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->getSearchSuggestions: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | [**SearchSuggestionType**](.md)|  | 
 **country** | **String**|  | [optional] 
 **make** | **String**|  | [optional] 
 **model** | **String**|  | [optional] 
 **state** | **String**|  | [optional] 

### Return type

**List<String>**

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **search**
> SearchResponseDto search(clip, motion, page, q, query, recent, size, smart, type, withArchived)



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
final clip = true; // bool | 
final motion = true; // bool | 
final page = 8.14; // num | 
final q = q_example; // String | 
final query = query_example; // String | 
final recent = true; // bool | 
final size = 8.14; // num | 
final smart = true; // bool | 
final type = type_example; // String | 
final withArchived = true; // bool | 

try {
    final result = api_instance.search(clip, motion, page, q, query, recent, size, smart, type, withArchived);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->search: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **clip** | **bool**|  | [optional] 
 **motion** | **bool**|  | [optional] 
 **page** | **num**|  | [optional] 
 **q** | **String**|  | [optional] 
 **query** | **String**|  | [optional] 
 **recent** | **bool**|  | [optional] 
 **size** | **num**|  | [optional] 
 **smart** | **bool**|  | [optional] 
 **type** | **String**|  | [optional] 
 **withArchived** | **bool**|  | [optional] 

### Return type

[**SearchResponseDto**](SearchResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchMetadata**
> SearchResponseDto searchMetadata(checksum, city, country, createdAfter, createdBefore, deviceAssetId, deviceId, encodedVideoPath, id, isArchived, isEncoded, isExternal, isFavorite, isMotion, isOffline, isReadOnly, isVisible, lensModel, libraryId, make, model, order, originalFileName, originalPath, page, resizePath, size, state, takenAfter, takenBefore, trashedAfter, trashedBefore, type, updatedAfter, updatedBefore, webpPath, withArchived, withDeleted, withExif, withPeople, withStacked)



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
final checksum = checksum_example; // String | 
final city = city_example; // String | 
final country = country_example; // String | 
final createdAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final createdBefore = 2013-10-20T19:20:30+01:00; // DateTime | 
final deviceAssetId = deviceAssetId_example; // String | 
final deviceId = deviceId_example; // String | 
final encodedVideoPath = encodedVideoPath_example; // String | 
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final isArchived = true; // bool | 
final isEncoded = true; // bool | 
final isExternal = true; // bool | 
final isFavorite = true; // bool | 
final isMotion = true; // bool | 
final isOffline = true; // bool | 
final isReadOnly = true; // bool | 
final isVisible = true; // bool | 
final lensModel = lensModel_example; // String | 
final libraryId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final make = make_example; // String | 
final model = model_example; // String | 
final order = ; // AssetOrder | 
final originalFileName = originalFileName_example; // String | 
final originalPath = originalPath_example; // String | 
final page = 8.14; // num | 
final resizePath = resizePath_example; // String | 
final size = 8.14; // num | 
final state = state_example; // String | 
final takenAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final takenBefore = 2013-10-20T19:20:30+01:00; // DateTime | 
final trashedAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final trashedBefore = 2013-10-20T19:20:30+01:00; // DateTime | 
final type = ; // AssetTypeEnum | 
final updatedAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final updatedBefore = 2013-10-20T19:20:30+01:00; // DateTime | 
final webpPath = webpPath_example; // String | 
final withArchived = true; // bool | 
final withDeleted = true; // bool | 
final withExif = true; // bool | 
final withPeople = true; // bool | 
final withStacked = true; // bool | 

try {
    final result = api_instance.searchMetadata(checksum, city, country, createdAfter, createdBefore, deviceAssetId, deviceId, encodedVideoPath, id, isArchived, isEncoded, isExternal, isFavorite, isMotion, isOffline, isReadOnly, isVisible, lensModel, libraryId, make, model, order, originalFileName, originalPath, page, resizePath, size, state, takenAfter, takenBefore, trashedAfter, trashedBefore, type, updatedAfter, updatedBefore, webpPath, withArchived, withDeleted, withExif, withPeople, withStacked);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchMetadata: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **checksum** | **String**|  | [optional] 
 **city** | **String**|  | [optional] 
 **country** | **String**|  | [optional] 
 **createdAfter** | **DateTime**|  | [optional] 
 **createdBefore** | **DateTime**|  | [optional] 
 **deviceAssetId** | **String**|  | [optional] 
 **deviceId** | **String**|  | [optional] 
 **encodedVideoPath** | **String**|  | [optional] 
 **id** | **String**|  | [optional] 
 **isArchived** | **bool**|  | [optional] 
 **isEncoded** | **bool**|  | [optional] 
 **isExternal** | **bool**|  | [optional] 
 **isFavorite** | **bool**|  | [optional] 
 **isMotion** | **bool**|  | [optional] 
 **isOffline** | **bool**|  | [optional] 
 **isReadOnly** | **bool**|  | [optional] 
 **isVisible** | **bool**|  | [optional] 
 **lensModel** | **String**|  | [optional] 
 **libraryId** | **String**|  | [optional] 
 **make** | **String**|  | [optional] 
 **model** | **String**|  | [optional] 
 **order** | [**AssetOrder**](.md)|  | [optional] 
 **originalFileName** | **String**|  | [optional] 
 **originalPath** | **String**|  | [optional] 
 **page** | **num**|  | [optional] 
 **resizePath** | **String**|  | [optional] 
 **size** | **num**|  | [optional] 
 **state** | **String**|  | [optional] 
 **takenAfter** | **DateTime**|  | [optional] 
 **takenBefore** | **DateTime**|  | [optional] 
 **trashedAfter** | **DateTime**|  | [optional] 
 **trashedBefore** | **DateTime**|  | [optional] 
 **type** | [**AssetTypeEnum**](.md)|  | [optional] 
 **updatedAfter** | **DateTime**|  | [optional] 
 **updatedBefore** | **DateTime**|  | [optional] 
 **webpPath** | **String**|  | [optional] 
 **withArchived** | **bool**|  | [optional] 
 **withDeleted** | **bool**|  | [optional] 
 **withExif** | **bool**|  | [optional] 
 **withPeople** | **bool**|  | [optional] 
 **withStacked** | **bool**|  | [optional] 

### Return type

[**SearchResponseDto**](SearchResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchPerson**
> List<PersonResponseDto> searchPerson(name, withHidden)



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
final name = name_example; // String | 
final withHidden = true; // bool | 

try {
    final result = api_instance.searchPerson(name, withHidden);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchPerson: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **name** | **String**|  | 
 **withHidden** | **bool**|  | [optional] 

### Return type

[**List<PersonResponseDto>**](PersonResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchSmart**
> SearchResponseDto searchSmart(query, city, country, createdAfter, createdBefore, deviceId, isArchived, isEncoded, isExternal, isFavorite, isMotion, isOffline, isReadOnly, isVisible, lensModel, libraryId, make, model, page, size, state, takenAfter, takenBefore, trashedAfter, trashedBefore, type, updatedAfter, updatedBefore, withArchived, withDeleted, withExif)



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
final query = query_example; // String | 
final city = city_example; // String | 
final country = country_example; // String | 
final createdAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final createdBefore = 2013-10-20T19:20:30+01:00; // DateTime | 
final deviceId = deviceId_example; // String | 
final isArchived = true; // bool | 
final isEncoded = true; // bool | 
final isExternal = true; // bool | 
final isFavorite = true; // bool | 
final isMotion = true; // bool | 
final isOffline = true; // bool | 
final isReadOnly = true; // bool | 
final isVisible = true; // bool | 
final lensModel = lensModel_example; // String | 
final libraryId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final make = make_example; // String | 
final model = model_example; // String | 
final page = 8.14; // num | 
final size = 8.14; // num | 
final state = state_example; // String | 
final takenAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final takenBefore = 2013-10-20T19:20:30+01:00; // DateTime | 
final trashedAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final trashedBefore = 2013-10-20T19:20:30+01:00; // DateTime | 
final type = ; // AssetTypeEnum | 
final updatedAfter = 2013-10-20T19:20:30+01:00; // DateTime | 
final updatedBefore = 2013-10-20T19:20:30+01:00; // DateTime | 
final withArchived = true; // bool | 
final withDeleted = true; // bool | 
final withExif = true; // bool | 

try {
    final result = api_instance.searchSmart(query, city, country, createdAfter, createdBefore, deviceId, isArchived, isEncoded, isExternal, isFavorite, isMotion, isOffline, isReadOnly, isVisible, lensModel, libraryId, make, model, page, size, state, takenAfter, takenBefore, trashedAfter, trashedBefore, type, updatedAfter, updatedBefore, withArchived, withDeleted, withExif);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchSmart: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **query** | **String**|  | 
 **city** | **String**|  | [optional] 
 **country** | **String**|  | [optional] 
 **createdAfter** | **DateTime**|  | [optional] 
 **createdBefore** | **DateTime**|  | [optional] 
 **deviceId** | **String**|  | [optional] 
 **isArchived** | **bool**|  | [optional] 
 **isEncoded** | **bool**|  | [optional] 
 **isExternal** | **bool**|  | [optional] 
 **isFavorite** | **bool**|  | [optional] 
 **isMotion** | **bool**|  | [optional] 
 **isOffline** | **bool**|  | [optional] 
 **isReadOnly** | **bool**|  | [optional] 
 **isVisible** | **bool**|  | [optional] 
 **lensModel** | **String**|  | [optional] 
 **libraryId** | **String**|  | [optional] 
 **make** | **String**|  | [optional] 
 **model** | **String**|  | [optional] 
 **page** | **num**|  | [optional] 
 **size** | **num**|  | [optional] 
 **state** | **String**|  | [optional] 
 **takenAfter** | **DateTime**|  | [optional] 
 **takenBefore** | **DateTime**|  | [optional] 
 **trashedAfter** | **DateTime**|  | [optional] 
 **trashedBefore** | **DateTime**|  | [optional] 
 **type** | [**AssetTypeEnum**](.md)|  | [optional] 
 **updatedAfter** | **DateTime**|  | [optional] 
 **updatedBefore** | **DateTime**|  | [optional] 
 **withArchived** | **bool**|  | [optional] 
 **withDeleted** | **bool**|  | [optional] 
 **withExif** | **bool**|  | [optional] 

### Return type

[**SearchResponseDto**](SearchResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

