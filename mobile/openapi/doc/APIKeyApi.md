# openapi.api.APIKeyApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createKey**](APIKeyApi.md#createkey) | **POST** /api-key | 
[**deleteKey**](APIKeyApi.md#deletekey) | **DELETE** /api-key/{id} | 
[**getKey**](APIKeyApi.md#getkey) | **GET** /api-key/{id} | 
[**getKeys**](APIKeyApi.md#getkeys) | **GET** /api-key | 
[**updateKey**](APIKeyApi.md#updatekey) | **PUT** /api-key/{id} | 


# **createKey**
> APIKeyCreateResponseDto createKey(aPIKeyCreateDto)





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = APIKeyApi();
final aPIKeyCreateDto = APIKeyCreateDto(); // APIKeyCreateDto | 

try {
    final result = api_instance.createKey(aPIKeyCreateDto);
    print(result);
} catch (e) {
    print('Exception when calling APIKeyApi->createKey: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **aPIKeyCreateDto** | [**APIKeyCreateDto**](APIKeyCreateDto.md)|  | 

### Return type

[**APIKeyCreateResponseDto**](APIKeyCreateResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteKey**
> deleteKey(id)





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = APIKeyApi();
final id = id_example; // String | 

try {
    api_instance.deleteKey(id);
} catch (e) {
    print('Exception when calling APIKeyApi->deleteKey: $e\n');
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

# **getKey**
> APIKeyResponseDto getKey(id)





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = APIKeyApi();
final id = id_example; // String | 

try {
    final result = api_instance.getKey(id);
    print(result);
} catch (e) {
    print('Exception when calling APIKeyApi->getKey: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**APIKeyResponseDto**](APIKeyResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getKeys**
> List<APIKeyResponseDto> getKeys()





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = APIKeyApi();

try {
    final result = api_instance.getKeys();
    print(result);
} catch (e) {
    print('Exception when calling APIKeyApi->getKeys: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<APIKeyResponseDto>**](APIKeyResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateKey**
> APIKeyResponseDto updateKey(id, aPIKeyUpdateDto)





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = APIKeyApi();
final id = id_example; // String | 
final aPIKeyUpdateDto = APIKeyUpdateDto(); // APIKeyUpdateDto | 

try {
    final result = api_instance.updateKey(id, aPIKeyUpdateDto);
    print(result);
} catch (e) {
    print('Exception when calling APIKeyApi->updateKey: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **aPIKeyUpdateDto** | [**APIKeyUpdateDto**](APIKeyUpdateDto.md)|  | 

### Return type

[**APIKeyResponseDto**](APIKeyResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

