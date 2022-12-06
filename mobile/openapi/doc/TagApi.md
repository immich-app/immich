# openapi.api.TagApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create**](TagApi.md#create) | **POST** /tag | 
[**delete**](TagApi.md#delete) | **DELETE** /tag/{id} | 
[**findAll**](TagApi.md#findall) | **GET** /tag | 
[**findOne**](TagApi.md#findone) | **GET** /tag/{id} | 
[**update**](TagApi.md#update) | **PATCH** /tag/{id} | 


# **create**
> TagResponseDto create(createTagDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = TagApi();
final createTagDto = CreateTagDto(); // CreateTagDto | 

try {
    final result = api_instance.create(createTagDto);
    print(result);
} catch (e) {
    print('Exception when calling TagApi->create: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createTagDto** | [**CreateTagDto**](CreateTagDto.md)|  | 

### Return type

[**TagResponseDto**](TagResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **delete**
> delete(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = TagApi();
final id = id_example; // String | 

try {
    api_instance.delete(id);
} catch (e) {
    print('Exception when calling TagApi->delete: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **findAll**
> List<TagResponseDto> findAll()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = TagApi();

try {
    final result = api_instance.findAll();
    print(result);
} catch (e) {
    print('Exception when calling TagApi->findAll: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<TagResponseDto>**](TagResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **findOne**
> TagResponseDto findOne(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = TagApi();
final id = id_example; // String | 

try {
    final result = api_instance.findOne(id);
    print(result);
} catch (e) {
    print('Exception when calling TagApi->findOne: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**TagResponseDto**](TagResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update**
> TagResponseDto update(id, updateTagDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = TagApi();
final id = id_example; // String | 
final updateTagDto = UpdateTagDto(); // UpdateTagDto | 

try {
    final result = api_instance.update(id, updateTagDto);
    print(result);
} catch (e) {
    print('Exception when calling TagApi->update: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **updateTagDto** | [**UpdateTagDto**](UpdateTagDto.md)|  | 

### Return type

[**TagResponseDto**](TagResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

