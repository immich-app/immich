# openapi.api.SearchApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAssetsByCity**](SearchApi.md#getassetsbycity) | **GET** /search/cities | Retrieve assets by city
[**getExploreData**](SearchApi.md#getexploredata) | **GET** /search/explore | Retrieve explore data
[**getSearchSuggestions**](SearchApi.md#getsearchsuggestions) | **GET** /search/suggestions | Retrieve search suggestions
[**searchAssetStatistics**](SearchApi.md#searchassetstatistics) | **POST** /search/statistics | Search asset statistics
[**searchAssets**](SearchApi.md#searchassets) | **POST** /search/metadata | Search assets by metadata
[**searchLargeAssets**](SearchApi.md#searchlargeassets) | **POST** /search/large-assets | Search large assets
[**searchPerson**](SearchApi.md#searchperson) | **GET** /search/person | Search people
[**searchPlaces**](SearchApi.md#searchplaces) | **GET** /search/places | Search places
[**searchRandom**](SearchApi.md#searchrandom) | **POST** /search/random | Search random assets
[**searchSmart**](SearchApi.md#searchsmart) | **POST** /search/smart | Smart asset search


# **getAssetsByCity**
> List<AssetResponseDto> getAssetsByCity()

Retrieve assets by city

Retrieve a list of assets with each asset belonging to a different city. This endpoint is used on the places pages to show a single thumbnail for each city the user has assets in.

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
    final result = api_instance.getAssetsByCity();
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->getAssetsByCity: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getExploreData**
> List<SearchExploreResponseDto> getExploreData()

Retrieve explore data

Retrieve data for the explore section, such as popular people and places.

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
> List<String> getSearchSuggestions(type, country, includeNull, lensModel, make, model, state)

Retrieve search suggestions

Retrieve search suggestions based on partial input. This endpoint is used for typeahead search features.

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
final country = country_example; // String | Filter by country
final includeNull = true; // bool | Include null values in suggestions
final lensModel = lensModel_example; // String | Filter by lens model
final make = make_example; // String | Filter by camera make
final model = model_example; // String | Filter by camera model
final state = state_example; // String | Filter by state/province

try {
    final result = api_instance.getSearchSuggestions(type, country, includeNull, lensModel, make, model, state);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->getSearchSuggestions: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | [**SearchSuggestionType**](.md)|  | 
 **country** | **String**| Filter by country | [optional] 
 **includeNull** | **bool**| Include null values in suggestions | [optional] 
 **lensModel** | **String**| Filter by lens model | [optional] 
 **make** | **String**| Filter by camera make | [optional] 
 **model** | **String**| Filter by camera model | [optional] 
 **state** | **String**| Filter by state/province | [optional] 

### Return type

**List<String>**

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchAssetStatistics**
> SearchStatisticsResponseDto searchAssetStatistics(statisticsSearchDto)

Search asset statistics

Retrieve statistical data about assets based on search criteria, such as the total matching count.

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
final statisticsSearchDto = StatisticsSearchDto(); // StatisticsSearchDto | 

try {
    final result = api_instance.searchAssetStatistics(statisticsSearchDto);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchAssetStatistics: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **statisticsSearchDto** | [**StatisticsSearchDto**](StatisticsSearchDto.md)|  | 

### Return type

[**SearchStatisticsResponseDto**](SearchStatisticsResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchAssets**
> SearchResponseDto searchAssets(metadataSearchDto, key, slug)

Search assets by metadata

Search for assets based on various metadata criteria.

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
final metadataSearchDto = MetadataSearchDto(); // MetadataSearchDto | 
final key = key_example; // String | 
final slug = slug_example; // String | 

try {
    final result = api_instance.searchAssets(metadataSearchDto, key, slug);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchAssets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **metadataSearchDto** | [**MetadataSearchDto**](MetadataSearchDto.md)|  | 
 **key** | **String**|  | [optional] 
 **slug** | **String**|  | [optional] 

### Return type

[**SearchResponseDto**](SearchResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchLargeAssets**
> List<AssetResponseDto> searchLargeAssets(albumIds, city, country, createdAfter, createdBefore, isEncoded, isFavorite, isMotion, isNotInAlbum, isOffline, lensModel, libraryId, make, minFileSize, model, ocr, personIds, rating, size, state, tagIds, takenAfter, takenBefore, trashedAfter, trashedBefore, type, updatedAfter, updatedBefore, visibility, withDeleted, withExif)

Search large assets

Search for assets that are considered large based on specified criteria.

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
final albumIds = []; // List<String> | Filter by album IDs
final city = city_example; // String | Filter by city name
final country = country_example; // String | Filter by country name
final createdAfter = 2024-01-01T00:00Z; // DateTime | Filter by creation date (after)
final createdBefore = 2024-01-01T00:00Z; // DateTime | Filter by creation date (before)
final isEncoded = true; // bool | Filter by encoded status
final isFavorite = true; // bool | Filter by favorite status
final isMotion = true; // bool | Filter by motion photo status
final isNotInAlbum = true; // bool | Filter assets not in any album
final isOffline = true; // bool | Filter by offline status
final lensModel = lensModel_example; // String | Filter by lens model
final libraryId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Library ID to filter by
final make = make_example; // String | Filter by camera make
final minFileSize = 56; // int | Minimum file size in bytes
final model = model_example; // String | Filter by camera model
final ocr = ocr_example; // String | Filter by OCR text content
final personIds = []; // List<String> | Filter by person IDs
final rating = 56; // int | Filter by rating [1-5], or null for unrated
final size = 56; // int | Number of results to return
final state = state_example; // String | Filter by state/province name
final tagIds = []; // List<String> | Filter by tag IDs
final takenAfter = 2024-01-01T00:00Z; // DateTime | Filter by taken date (after)
final takenBefore = 2024-01-01T00:00Z; // DateTime | Filter by taken date (before)
final trashedAfter = 2024-01-01T00:00Z; // DateTime | Filter by trash date (after)
final trashedBefore = 2024-01-01T00:00Z; // DateTime | Filter by trash date (before)
final type = ; // AssetTypeEnum | 
final updatedAfter = 2024-01-01T00:00Z; // DateTime | Filter by update date (after)
final updatedBefore = 2024-01-01T00:00Z; // DateTime | Filter by update date (before)
final visibility = ; // AssetVisibility | 
final withDeleted = true; // bool | Include deleted assets
final withExif = true; // bool | Include EXIF data in response

try {
    final result = api_instance.searchLargeAssets(albumIds, city, country, createdAfter, createdBefore, isEncoded, isFavorite, isMotion, isNotInAlbum, isOffline, lensModel, libraryId, make, minFileSize, model, ocr, personIds, rating, size, state, tagIds, takenAfter, takenBefore, trashedAfter, trashedBefore, type, updatedAfter, updatedBefore, visibility, withDeleted, withExif);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchLargeAssets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **albumIds** | [**List<String>**](String.md)| Filter by album IDs | [optional] [default to const []]
 **city** | **String**| Filter by city name | [optional] 
 **country** | **String**| Filter by country name | [optional] 
 **createdAfter** | **DateTime**| Filter by creation date (after) | [optional] 
 **createdBefore** | **DateTime**| Filter by creation date (before) | [optional] 
 **isEncoded** | **bool**| Filter by encoded status | [optional] 
 **isFavorite** | **bool**| Filter by favorite status | [optional] 
 **isMotion** | **bool**| Filter by motion photo status | [optional] 
 **isNotInAlbum** | **bool**| Filter assets not in any album | [optional] 
 **isOffline** | **bool**| Filter by offline status | [optional] 
 **lensModel** | **String**| Filter by lens model | [optional] 
 **libraryId** | **String**| Library ID to filter by | [optional] 
 **make** | **String**| Filter by camera make | [optional] 
 **minFileSize** | **int**| Minimum file size in bytes | [optional] 
 **model** | **String**| Filter by camera model | [optional] 
 **ocr** | **String**| Filter by OCR text content | [optional] 
 **personIds** | [**List<String>**](String.md)| Filter by person IDs | [optional] [default to const []]
 **rating** | **int**| Filter by rating [1-5], or null for unrated | [optional] 
 **size** | **int**| Number of results to return | [optional] 
 **state** | **String**| Filter by state/province name | [optional] 
 **tagIds** | [**List<String>**](String.md)| Filter by tag IDs | [optional] [default to const []]
 **takenAfter** | **DateTime**| Filter by taken date (after) | [optional] 
 **takenBefore** | **DateTime**| Filter by taken date (before) | [optional] 
 **trashedAfter** | **DateTime**| Filter by trash date (after) | [optional] 
 **trashedBefore** | **DateTime**| Filter by trash date (before) | [optional] 
 **type** | [**AssetTypeEnum**](.md)|  | [optional] 
 **updatedAfter** | **DateTime**| Filter by update date (after) | [optional] 
 **updatedBefore** | **DateTime**| Filter by update date (before) | [optional] 
 **visibility** | [**AssetVisibility**](.md)|  | [optional] 
 **withDeleted** | **bool**| Include deleted assets | [optional] 
 **withExif** | **bool**| Include EXIF data in response | [optional] 

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchPerson**
> List<PersonResponseDto> searchPerson(name, withHidden)

Search people

Search for people by name.

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
final name = name_example; // String | Person name to search for
final withHidden = true; // bool | Include hidden people

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
 **name** | **String**| Person name to search for | 
 **withHidden** | **bool**| Include hidden people | [optional] 

### Return type

[**List<PersonResponseDto>**](PersonResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchPlaces**
> List<PlacesResponseDto> searchPlaces(name)

Search places

Search for places by name.

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
final name = name_example; // String | Place name to search for

try {
    final result = api_instance.searchPlaces(name);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchPlaces: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **name** | **String**| Place name to search for | 

### Return type

[**List<PlacesResponseDto>**](PlacesResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchRandom**
> List<AssetResponseDto> searchRandom(randomSearchDto)

Search random assets

Retrieve a random selection of assets based on the provided criteria.

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
final randomSearchDto = RandomSearchDto(); // RandomSearchDto | 

try {
    final result = api_instance.searchRandom(randomSearchDto);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchRandom: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **randomSearchDto** | [**RandomSearchDto**](RandomSearchDto.md)|  | 

### Return type

[**List<AssetResponseDto>**](AssetResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchSmart**
> SearchResponseDto searchSmart(smartSearchDto)

Smart asset search

Perform a smart search for assets by using machine learning vectors to determine relevance.

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
final smartSearchDto = SmartSearchDto(); // SmartSearchDto | 

try {
    final result = api_instance.searchSmart(smartSearchDto);
    print(result);
} catch (e) {
    print('Exception when calling SearchApi->searchSmart: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **smartSearchDto** | [**SmartSearchDto**](SmartSearchDto.md)|  | 

### Return type

[**SearchResponseDto**](SearchResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

