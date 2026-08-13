# openapi.api.TagsApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**bulkTagAssets**](TagsApi.md#bulktagassets) | **PUT** /tags/assets | Tag assets
[**createTag**](TagsApi.md#createtag) | **POST** /tags | Create a tag
[**deleteTag**](TagsApi.md#deletetag) | **DELETE** /tags/{id} | Delete a tag
[**getAllTags**](TagsApi.md#getalltags) | **GET** /tags | Retrieve tags
[**getTagById**](TagsApi.md#gettagbyid) | **GET** /tags/{id} | Retrieve a tag
[**tagAssets**](TagsApi.md#tagassets) | **PUT** /tags/{id}/assets | Tag assets
[**untagAssets**](TagsApi.md#untagassets) | **DELETE** /tags/{id}/assets | Untag assets
[**updateTag**](TagsApi.md#updatetag) | **PUT** /tags/{id} | Update a tag
[**upsertTags**](TagsApi.md#upserttags) | **PUT** /tags | Upsert tags


# **bulkTagAssets**
> TagBulkAssetsResponseDto bulkTagAssets(tagBulkAssetsDto)

Tag assets

Add multiple tags to multiple assets in a single request.

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

final api_instance = TagsApi();
final tagBulkAssetsDto = TagBulkAssetsDto(); // TagBulkAssetsDto | 

try {
    final result = api_instance.bulkTagAssets(tagBulkAssetsDto);
    print(result);
} catch (e) {
    print('Exception when calling TagsApi->bulkTagAssets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **tagBulkAssetsDto** | [**TagBulkAssetsDto**](TagBulkAssetsDto.md)|  | 

### Return type

[**TagBulkAssetsResponseDto**](TagBulkAssetsResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createTag**
> TagResponseDto createTag(tagCreateDto)

Create a tag

Create a new tag by providing a name and optional color.

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

final api_instance = TagsApi();
final tagCreateDto = TagCreateDto(); // TagCreateDto | 

try {
    final result = api_instance.createTag(tagCreateDto);
    print(result);
} catch (e) {
    print('Exception when calling TagsApi->createTag: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **tagCreateDto** | [**TagCreateDto**](TagCreateDto.md)|  | 

### Return type

[**TagResponseDto**](TagResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteTag**
> deleteTag(id)

Delete a tag

Delete a specific tag by its ID.

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

final api_instance = TagsApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api_instance.deleteTag(id);
} catch (e) {
    print('Exception when calling TagsApi->deleteTag: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAllTags**
> List<TagResponseDto> getAllTags()

Retrieve tags

Retrieve a list of all tags.

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

final api_instance = TagsApi();

try {
    final result = api_instance.getAllTags();
    print(result);
} catch (e) {
    print('Exception when calling TagsApi->getAllTags: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<TagResponseDto>**](TagResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getTagById**
> TagResponseDto getTagById(id)

Retrieve a tag

Retrieve a specific tag by its ID.

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

final api_instance = TagsApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final result = api_instance.getTagById(id);
    print(result);
} catch (e) {
    print('Exception when calling TagsApi->getTagById: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**TagResponseDto**](TagResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **tagAssets**
> List<BulkIdResponseDto> tagAssets(id, bulkIdsDto)

Tag assets

Add a tag to all the specified assets.

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

final api_instance = TagsApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final bulkIdsDto = BulkIdsDto(); // BulkIdsDto | 

try {
    final result = api_instance.tagAssets(id, bulkIdsDto);
    print(result);
} catch (e) {
    print('Exception when calling TagsApi->tagAssets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **bulkIdsDto** | [**BulkIdsDto**](BulkIdsDto.md)|  | 

### Return type

[**List<BulkIdResponseDto>**](BulkIdResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **untagAssets**
> List<BulkIdResponseDto> untagAssets(id, bulkIdsDto)

Untag assets

Remove a tag from all the specified assets.

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

final api_instance = TagsApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final bulkIdsDto = BulkIdsDto(); // BulkIdsDto | 

try {
    final result = api_instance.untagAssets(id, bulkIdsDto);
    print(result);
} catch (e) {
    print('Exception when calling TagsApi->untagAssets: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **bulkIdsDto** | [**BulkIdsDto**](BulkIdsDto.md)|  | 

### Return type

[**List<BulkIdResponseDto>**](BulkIdResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateTag**
> TagResponseDto updateTag(id, tagUpdateDto)

Update a tag

Update an existing tag identified by its ID.

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

final api_instance = TagsApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final tagUpdateDto = TagUpdateDto(); // TagUpdateDto | 

try {
    final result = api_instance.updateTag(id, tagUpdateDto);
    print(result);
} catch (e) {
    print('Exception when calling TagsApi->updateTag: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **tagUpdateDto** | [**TagUpdateDto**](TagUpdateDto.md)|  | 

### Return type

[**TagResponseDto**](TagResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertTags**
> List<TagResponseDto> upsertTags(tagUpsertDto)

Upsert tags

Create or update multiple tags in a single request.

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

final api_instance = TagsApi();
final tagUpsertDto = TagUpsertDto(); // TagUpsertDto | 

try {
    final result = api_instance.upsertTags(tagUpsertDto);
    print(result);
} catch (e) {
    print('Exception when calling TagsApi->upsertTags: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **tagUpsertDto** | [**TagUpsertDto**](TagUpsertDto.md)|  | 

### Return type

[**List<TagResponseDto>**](TagResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

