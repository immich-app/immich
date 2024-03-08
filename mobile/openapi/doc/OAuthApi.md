# openapi.api.OAuthApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**finishOAuth**](OAuthApi.md#finishoauth) | **POST** /oauth/callback | 
[**linkOAuthAccount**](OAuthApi.md#linkoauthaccount) | **POST** /oauth/link | 
[**redirectOAuthToMobile**](OAuthApi.md#redirectoauthtomobile) | **GET** /oauth/mobile-redirect | 
[**startOAuth**](OAuthApi.md#startoauth) | **POST** /oauth/authorize | 
[**unlinkOAuthAccount**](OAuthApi.md#unlinkoauthaccount) | **POST** /oauth/unlink | 


# **finishOAuth**
> LoginResponseDto finishOAuth(oAuthCallbackDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OAuthApi();
final oAuthCallbackDto = OAuthCallbackDto(); // OAuthCallbackDto | 

try {
    final result = api_instance.finishOAuth(oAuthCallbackDto);
    print(result);
} catch (e) {
    print('Exception when calling OAuthApi->finishOAuth: $e\n');
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

# **linkOAuthAccount**
> UserResponseDto linkOAuthAccount(oAuthCallbackDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = OAuthApi();
final oAuthCallbackDto = OAuthCallbackDto(); // OAuthCallbackDto | 

try {
    final result = api_instance.linkOAuthAccount(oAuthCallbackDto);
    print(result);
} catch (e) {
    print('Exception when calling OAuthApi->linkOAuthAccount: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **oAuthCallbackDto** | [**OAuthCallbackDto**](OAuthCallbackDto.md)|  | 

### Return type

[**UserResponseDto**](UserResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **redirectOAuthToMobile**
> redirectOAuthToMobile()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OAuthApi();

try {
    api_instance.redirectOAuthToMobile();
} catch (e) {
    print('Exception when calling OAuthApi->redirectOAuthToMobile: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **startOAuth**
> OAuthAuthorizeResponseDto startOAuth(oAuthConfigDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OAuthApi();
final oAuthConfigDto = OAuthConfigDto(); // OAuthConfigDto | 

try {
    final result = api_instance.startOAuth(oAuthConfigDto);
    print(result);
} catch (e) {
    print('Exception when calling OAuthApi->startOAuth: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **oAuthConfigDto** | [**OAuthConfigDto**](OAuthConfigDto.md)|  | 

### Return type

[**OAuthAuthorizeResponseDto**](OAuthAuthorizeResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **unlinkOAuthAccount**
> UserResponseDto unlinkOAuthAccount()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = OAuthApi();

try {
    final result = api_instance.unlinkOAuthAccount();
    print(result);
} catch (e) {
    print('Exception when calling OAuthApi->unlinkOAuthAccount: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**UserResponseDto**](UserResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

