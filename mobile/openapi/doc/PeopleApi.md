# openapi.api.PeopleApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createPerson**](PeopleApi.md#createperson) | **POST** /people | Create a person
[**deletePeople**](PeopleApi.md#deletepeople) | **DELETE** /people | Delete people
[**deletePerson**](PeopleApi.md#deleteperson) | **DELETE** /people/{id} | Delete person
[**getAllPeople**](PeopleApi.md#getallpeople) | **GET** /people | Get all people
[**getPerson**](PeopleApi.md#getperson) | **GET** /people/{id} | Get a person
[**getPersonStatistics**](PeopleApi.md#getpersonstatistics) | **GET** /people/{id}/statistics | Get person statistics
[**getPersonThumbnail**](PeopleApi.md#getpersonthumbnail) | **GET** /people/{id}/thumbnail | Get person thumbnail
[**mergePerson**](PeopleApi.md#mergeperson) | **POST** /people/{id}/merge | Merge people
[**reassignFaces**](PeopleApi.md#reassignfaces) | **PUT** /people/{id}/reassign | Reassign faces
[**updatePeople**](PeopleApi.md#updatepeople) | **PUT** /people | Update people
[**updatePerson**](PeopleApi.md#updateperson) | **PUT** /people/{id} | Update person


# **createPerson**
> PersonResponseDto createPerson(personCreateDto)

Create a person

Create a new person that can have multiple faces assigned to them.

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

final api_instance = PeopleApi();
final personCreateDto = PersonCreateDto(); // PersonCreateDto | 

try {
    final result = api_instance.createPerson(personCreateDto);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->createPerson: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **personCreateDto** | [**PersonCreateDto**](PersonCreateDto.md)|  | 

### Return type

[**PersonResponseDto**](PersonResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePeople**
> deletePeople(bulkIdsDto)

Delete people

Bulk delete a list of people at once.

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

final api_instance = PeopleApi();
final bulkIdsDto = BulkIdsDto(); // BulkIdsDto | 

try {
    api_instance.deletePeople(bulkIdsDto);
} catch (e) {
    print('Exception when calling PeopleApi->deletePeople: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **bulkIdsDto** | [**BulkIdsDto**](BulkIdsDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deletePerson**
> deletePerson(id)

Delete person

Delete an individual person.

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

final api_instance = PeopleApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api_instance.deletePerson(id);
} catch (e) {
    print('Exception when calling PeopleApi->deletePerson: $e\n');
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

# **getAllPeople**
> PeopleResponseDto getAllPeople(closestAssetId, closestPersonId, page, size, withHidden)

Get all people

Retrieve a list of all people.

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

final api_instance = PeopleApi();
final closestAssetId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Closest asset ID for similarity search
final closestPersonId = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Closest person ID for similarity search
final page = 56; // int | Page number for pagination
final size = 56; // int | Number of items per page
final withHidden = true; // bool | Include hidden people

try {
    final result = api_instance.getAllPeople(closestAssetId, closestPersonId, page, size, withHidden);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->getAllPeople: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **closestAssetId** | **String**| Closest asset ID for similarity search | [optional] 
 **closestPersonId** | **String**| Closest person ID for similarity search | [optional] 
 **page** | **int**| Page number for pagination | [optional] [default to 1]
 **size** | **int**| Number of items per page | [optional] [default to 500]
 **withHidden** | **bool**| Include hidden people | [optional] 

### Return type

[**PeopleResponseDto**](PeopleResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPerson**
> PersonResponseDto getPerson(id)

Get a person

Retrieve a person by id.

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

final api_instance = PeopleApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final result = api_instance.getPerson(id);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->getPerson: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**PersonResponseDto**](PersonResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPersonStatistics**
> PersonStatisticsResponseDto getPersonStatistics(id)

Get person statistics

Retrieve statistics about a specific person.

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

final api_instance = PeopleApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final result = api_instance.getPersonStatistics(id);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->getPersonStatistics: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**PersonStatisticsResponseDto**](PersonStatisticsResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getPersonThumbnail**
> MultipartFile getPersonThumbnail(id)

Get person thumbnail

Retrieve the thumbnail file for a person.

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

final api_instance = PeopleApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final result = api_instance.getPersonThumbnail(id);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->getPersonThumbnail: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**MultipartFile**](MultipartFile.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **mergePerson**
> List<BulkIdResponseDto> mergePerson(id, mergePersonDto)

Merge people

Merge a list of people into the person specified in the path parameter.

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

final api_instance = PeopleApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final mergePersonDto = MergePersonDto(); // MergePersonDto | 

try {
    final result = api_instance.mergePerson(id, mergePersonDto);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->mergePerson: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **mergePersonDto** | [**MergePersonDto**](MergePersonDto.md)|  | 

### Return type

[**List<BulkIdResponseDto>**](BulkIdResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **reassignFaces**
> List<PersonResponseDto> reassignFaces(id, assetFaceUpdateDto)

Reassign faces

Bulk reassign a list of faces to a different person.

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

final api_instance = PeopleApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final assetFaceUpdateDto = AssetFaceUpdateDto(); // AssetFaceUpdateDto | 

try {
    final result = api_instance.reassignFaces(id, assetFaceUpdateDto);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->reassignFaces: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **assetFaceUpdateDto** | [**AssetFaceUpdateDto**](AssetFaceUpdateDto.md)|  | 

### Return type

[**List<PersonResponseDto>**](PersonResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePeople**
> List<BulkIdResponseDto> updatePeople(peopleUpdateDto)

Update people

Bulk update multiple people at once.

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

final api_instance = PeopleApi();
final peopleUpdateDto = PeopleUpdateDto(); // PeopleUpdateDto | 

try {
    final result = api_instance.updatePeople(peopleUpdateDto);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->updatePeople: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **peopleUpdateDto** | [**PeopleUpdateDto**](PeopleUpdateDto.md)|  | 

### Return type

[**List<BulkIdResponseDto>**](BulkIdResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updatePerson**
> PersonResponseDto updatePerson(id, personUpdateDto)

Update person

Update an individual person.

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

final api_instance = PeopleApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 
final personUpdateDto = PersonUpdateDto(); // PersonUpdateDto | 

try {
    final result = api_instance.updatePerson(id, personUpdateDto);
    print(result);
} catch (e) {
    print('Exception when calling PeopleApi->updatePerson: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **personUpdateDto** | [**PersonUpdateDto**](PersonUpdateDto.md)|  | 

### Return type

[**PersonResponseDto**](PersonResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

