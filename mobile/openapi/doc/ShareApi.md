# openapi.api.ShareApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**editSharedLink**](ShareApi.md#editsharedlink) | **PATCH** /share/{id} | 
[**getAllSharedLinks**](ShareApi.md#getallsharedlinks) | **GET** /share | 
[**getMySharedLink**](ShareApi.md#getmysharedlink) | **GET** /share/me | 
[**getSharedLinkById**](ShareApi.md#getsharedlinkbyid) | **GET** /share/{id} | 
[**removeSharedLink**](ShareApi.md#removesharedlink) | **DELETE** /share/{id} | 


# **editSharedLink**
> SharedLinkResponseDto editSharedLink(id, editSharedLinkDto)





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ShareApi();
final id = id_example; // String | 
final editSharedLinkDto = EditSharedLinkDto(); // EditSharedLinkDto | 

try {
    final result = api_instance.editSharedLink(id, editSharedLinkDto);
    print(result);
} catch (e) {
    print('Exception when calling ShareApi->editSharedLink: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **editSharedLinkDto** | [**EditSharedLinkDto**](EditSharedLinkDto.md)|  | 

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

# **getMySharedLink**
> SharedLinkResponseDto getMySharedLink()





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ShareApi();

try {
    final result = api_instance.getMySharedLink();
    print(result);
} catch (e) {
    print('Exception when calling ShareApi->getMySharedLink: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**SharedLinkResponseDto**](SharedLinkResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSharedLinkById**
> SharedLinkResponseDto getSharedLinkById(id)





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ShareApi();
final id = id_example; // String | 

try {
    final result = api_instance.getSharedLinkById(id);
    print(result);
} catch (e) {
    print('Exception when calling ShareApi->getSharedLinkById: $e\n');
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
> removeSharedLink(id)





### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ShareApi();
final id = id_example; // String | 

try {
    api_instance.removeSharedLink(id);
} catch (e) {
    print('Exception when calling ShareApi->removeSharedLink: $e\n');
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

