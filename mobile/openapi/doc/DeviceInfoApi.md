# openapi.api.DeviceInfoApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**upsertDeviceInfo**](DeviceInfoApi.md#upsertdeviceinfo) | **PUT** /device-info | 


# **upsertDeviceInfo**
> DeviceInfoResponseDto upsertDeviceInfo(upsertDeviceInfoDto)





### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = DeviceInfoApi();
final upsertDeviceInfoDto = UpsertDeviceInfoDto(); // UpsertDeviceInfoDto | 

try {
    final result = api_instance.upsertDeviceInfo(upsertDeviceInfoDto);
    print(result);
} catch (e) {
    print('Exception when calling DeviceInfoApi->upsertDeviceInfo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertDeviceInfoDto** | [**UpsertDeviceInfoDto**](UpsertDeviceInfoDto.md)|  | 

### Return type

[**DeviceInfoResponseDto**](DeviceInfoResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

