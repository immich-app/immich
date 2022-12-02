# openapi.api.TagApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**create**](TagApi.md#create) | **POST** /tag | 
[**findAll**](TagApi.md#findall) | **GET** /tag | 
[**findOne**](TagApi.md#findone) | **GET** /tag/{id} | 
[**remove**](TagApi.md#remove) | **DELETE** /tag/{id} | 
[**update**](TagApi.md#update) | **PATCH** /tag/{id} | 


# **create**
> TagEntity create(createTagDto)



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

[**TagEntity**](TagEntity.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **findAll**
> List<TagEntity> findAll()



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

[**List<TagEntity>**](TagEntity.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **findOne**
> Object findOne(id)



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

[**Object**](Object.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **remove**
> String remove(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = TagApi();
final id = id_example; // String | 

try {
    final result = api_instance.remove(id);
    print(result);
} catch (e) {
    print('Exception when calling TagApi->remove: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

**String**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **update**
> String update(id, updateTagDto)



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

**String**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

