# openapi.api.OAuthApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**callback**](OAuthApi.md#callback) | **POST** /oauth/callback | 
[**generateConfig**](OAuthApi.md#generateconfig) | **POST** /oauth/config | 


# **callback**
> LoginResponseDto callback(oAuthCallbackDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OAuthApi();
final oAuthCallbackDto = OAuthCallbackDto(); // OAuthCallbackDto | 

try {
    final result = api_instance.callback(oAuthCallbackDto);
    print(result);
} catch (e) {
    print('Exception when calling OAuthApi->callback: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **oAuthCallbackDto** | [**OAuthCallbackDto**](OAuthCallbackDto.md)|  | 

### Return type

[**LoginResponseDto**](LoginResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **generateConfig**
> OAuthConfigResponseDto generateConfig(oAuthConfigDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OAuthApi();
final oAuthConfigDto = OAuthConfigDto(); // OAuthConfigDto | 

try {
    final result = api_instance.generateConfig(oAuthConfigDto);
    print(result);
} catch (e) {
    print('Exception when calling OAuthApi->generateConfig: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **oAuthConfigDto** | [**OAuthConfigDto**](OAuthConfigDto.md)|  | 

### Return type

[**OAuthConfigResponseDto**](OAuthConfigResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

