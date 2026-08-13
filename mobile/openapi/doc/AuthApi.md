# openapi.api.AuthApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**oidcDeviceFlow**](AuthApi.md#oidcdeviceflow) | **GET** /yucca/auth/oidc/device | 


# **oidcDeviceFlow**
> DeviceFlowResponseDto oidcDeviceFlow()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthApi();

try {
    final result = api_instance.oidcDeviceFlow();
    print(result);
} catch (e) {
    print('Exception when calling AuthApi->oidcDeviceFlow: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**DeviceFlowResponseDto**](DeviceFlowResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

