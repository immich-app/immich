# openapi.api.DeviceInfoApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createDeviceInfo**](DeviceInfoApi.md#createdeviceinfo) | **POST** /device-info | 
[**updateDeviceInfo**](DeviceInfoApi.md#updatedeviceinfo) | **PATCH** /device-info | 


# **createDeviceInfo**
> DeviceInfoResponseDto createDeviceInfo(createDeviceInfoDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = DeviceInfoApi();
final createDeviceInfoDto = CreateDeviceInfoDto(); // CreateDeviceInfoDto | 

try {
    final result = api_instance.createDeviceInfo(createDeviceInfoDto);
    print(result);
} catch (e) {
    print('Exception when calling DeviceInfoApi->createDeviceInfo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createDeviceInfoDto** | [**CreateDeviceInfoDto**](CreateDeviceInfoDto.md)|  | 

### Return type

[**DeviceInfoResponseDto**](DeviceInfoResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateDeviceInfo**
> DeviceInfoResponseDto updateDeviceInfo(updateDeviceInfoDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = DeviceInfoApi();
final updateDeviceInfoDto = UpdateDeviceInfoDto(); // UpdateDeviceInfoDto | 

try {
    final result = api_instance.updateDeviceInfo(updateDeviceInfoDto);
    print(result);
} catch (e) {
    print('Exception when calling DeviceInfoApi->updateDeviceInfo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateDeviceInfoDto** | [**UpdateDeviceInfoDto**](UpdateDeviceInfoDto.md)|  | 

### Return type

[**DeviceInfoResponseDto**](DeviceInfoResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

