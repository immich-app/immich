# openapi.api.SystemConfigApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getFFmpegConfig**](SystemConfigApi.md#getffmpegconfig) | **GET** /system-config/ffmpeg | 
[**getOAuthConfig**](SystemConfigApi.md#getoauthconfig) | **GET** /system-config/oauth | 
[**updateFFmpegConfig**](SystemConfigApi.md#updateffmpegconfig) | **PUT** /system-config/ffmpeg | 
[**updateOAuthConfig**](SystemConfigApi.md#updateoauthconfig) | **PUT** /system-config/oauth | 


# **getFFmpegConfig**
> FFmpegSystemConfigResponseDto getFFmpegConfig()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = SystemConfigApi();

try {
    final result = api_instance.getFFmpegConfig();
    print(result);
} catch (e) {
    print('Exception when calling SystemConfigApi->getFFmpegConfig: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**FFmpegSystemConfigResponseDto**](FFmpegSystemConfigResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getOAuthConfig**
> OAuthSystemConfigResponseDto getOAuthConfig()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = SystemConfigApi();

try {
    final result = api_instance.getOAuthConfig();
    print(result);
} catch (e) {
    print('Exception when calling SystemConfigApi->getOAuthConfig: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**OAuthSystemConfigResponseDto**](OAuthSystemConfigResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateFFmpegConfig**
> FFmpegSystemConfigResponseDto updateFFmpegConfig(updateFFmpegSystemConfigDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = SystemConfigApi();
final updateFFmpegSystemConfigDto = UpdateFFmpegSystemConfigDto(); // UpdateFFmpegSystemConfigDto | 

try {
    final result = api_instance.updateFFmpegConfig(updateFFmpegSystemConfigDto);
    print(result);
} catch (e) {
    print('Exception when calling SystemConfigApi->updateFFmpegConfig: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateFFmpegSystemConfigDto** | [**UpdateFFmpegSystemConfigDto**](UpdateFFmpegSystemConfigDto.md)|  | 

### Return type

[**FFmpegSystemConfigResponseDto**](FFmpegSystemConfigResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateOAuthConfig**
> OAuthSystemConfigResponseDto updateOAuthConfig(updateOAuthSystemConfigDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = SystemConfigApi();
final updateOAuthSystemConfigDto = UpdateOAuthSystemConfigDto(); // UpdateOAuthSystemConfigDto | 

try {
    final result = api_instance.updateOAuthConfig(updateOAuthSystemConfigDto);
    print(result);
} catch (e) {
    print('Exception when calling SystemConfigApi->updateOAuthConfig: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateOAuthSystemConfigDto** | [**UpdateOAuthSystemConfigDto**](UpdateOAuthSystemConfigDto.md)|  | 

### Return type

[**OAuthSystemConfigResponseDto**](OAuthSystemConfigResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

