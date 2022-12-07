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
[**upsertDeviceInfo**](DeviceInfoApi.md#upsertdeviceinfo) | **PUT** /device-info | 


# **createDeviceInfo**
> DeviceInfoResponseDto createDeviceInfo(upsertDeviceInfoDto)



@deprecated

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
final upsertDeviceInfoDto = UpsertDeviceInfoDto(); // UpsertDeviceInfoDto | 

try {
    final result = api_instance.createDeviceInfo(upsertDeviceInfoDto);
    print(result);
} catch (e) {
    print('Exception when calling DeviceInfoApi->createDeviceInfo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertDeviceInfoDto** | [**UpsertDeviceInfoDto**](UpsertDeviceInfoDto.md)|  | 

### Return type

[**DeviceInfoResponseDto**](DeviceInfoResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateDeviceInfo**
> DeviceInfoResponseDto updateDeviceInfo(upsertDeviceInfoDto)



@deprecated

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
final upsertDeviceInfoDto = UpsertDeviceInfoDto(); // UpsertDeviceInfoDto | 

try {
    final result = api_instance.updateDeviceInfo(upsertDeviceInfoDto);
    print(result);
} catch (e) {
    print('Exception when calling DeviceInfoApi->updateDeviceInfo: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertDeviceInfoDto** | [**UpsertDeviceInfoDto**](UpsertDeviceInfoDto.md)|  | 

### Return type

[**DeviceInfoResponseDto**](DeviceInfoResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertDeviceInfo**
> DeviceInfoResponseDto upsertDeviceInfo(upsertDeviceInfoDto)



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

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

