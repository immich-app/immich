# openapi.api.ShareApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createSharedLink**](ShareApi.md#createsharedlink) | **POST** /share | 
[**getAllSharedLinks**](ShareApi.md#getallsharedlinks) | **GET** /share | 
[**getSharedLink**](ShareApi.md#getsharedlink) | **GET** /share/{id} | 
[**removeSharedLink**](ShareApi.md#removesharedlink) | **DELETE** /share/{id} | 


# **createSharedLink**
> SharedLinkResponseDto createSharedLink(createSharedLinkDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ShareApi();
final createSharedLinkDto = CreateSharedLinkDto(); // CreateSharedLinkDto | 

try {
    final result = api_instance.createSharedLink(createSharedLinkDto);
    print(result);
} catch (e) {
    print('Exception when calling ShareApi->createSharedLink: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createSharedLinkDto** | [**CreateSharedLinkDto**](CreateSharedLinkDto.md)|  | 

### Return type

[**SharedLinkResponseDto**](SharedLinkResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAllSharedLinks**
> List<SharedLinkResponseDto> getAllSharedLinks()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ShareApi();

try {
    final result = api_instance.getAllSharedLinks();
    print(result);
} catch (e) {
    print('Exception when calling ShareApi->getAllSharedLinks: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<SharedLinkResponseDto>**](SharedLinkResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSharedLink**
> SharedLinkResponseDto getSharedLink(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ShareApi();
final id = id_example; // String | 

try {
    final result = api_instance.getSharedLink(id);
    print(result);
} catch (e) {
    print('Exception when calling ShareApi->getSharedLink: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**SharedLinkResponseDto**](SharedLinkResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeSharedLink**
> SharedLinkResponseDto removeSharedLink(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ShareApi();
final id = id_example; // String | 

try {
    final result = api_instance.removeSharedLink(id);
    print(result);
} catch (e) {
    print('Exception when calling ShareApi->removeSharedLink: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**SharedLinkResponseDto**](SharedLinkResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

