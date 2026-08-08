# openapi.api.BackendApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createLocalBackend**](BackendApi.md#createlocalbackend) | **POST** /yucca/backend/local | 
[**getBackends**](BackendApi.md#getbackends) | **GET** /yucca/backend | 


# **createLocalBackend**
> BackendResponseDto createLocalBackend(createLocalBackendRequestDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = BackendApi();
final createLocalBackendRequestDto = CreateLocalBackendRequestDto(); // CreateLocalBackendRequestDto | 

try {
    final result = api_instance.createLocalBackend(createLocalBackendRequestDto);
    print(result);
} catch (e) {
    print('Exception when calling BackendApi->createLocalBackend: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createLocalBackendRequestDto** | [**CreateLocalBackendRequestDto**](CreateLocalBackendRequestDto.md)|  | 

### Return type

[**BackendResponseDto**](BackendResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getBackends**
> BackendsResponseDto getBackends()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = BackendApi();

try {
    final result = api_instance.getBackends();
    print(result);
} catch (e) {
    print('Exception when calling BackendApi->getBackends: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**BackendsResponseDto**](BackendsResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

