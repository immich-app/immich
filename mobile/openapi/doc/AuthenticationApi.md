# openapi.api.AuthenticationApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**adminSignUp**](AuthenticationApi.md#adminsignup) | **POST** /auth/admin-sign-up | 
[**changePassword**](AuthenticationApi.md#changepassword) | **POST** /auth/change-password | 
[**login**](AuthenticationApi.md#login) | **POST** /auth/login | 
[**logout**](AuthenticationApi.md#logout) | **POST** /auth/logout | 
[**validateAccessToken**](AuthenticationApi.md#validateaccesstoken) | **POST** /auth/validateToken | 


# **adminSignUp**
> AdminSignupResponseDto adminSignUp(signUpDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthenticationApi();
final signUpDto = SignUpDto(); // SignUpDto | 

try {
    final result = api_instance.adminSignUp(signUpDto);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->adminSignUp: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **signUpDto** | [**SignUpDto**](SignUpDto.md)|  | 

### Return type

[**AdminSignupResponseDto**](AdminSignupResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **changePassword**
> UserResponseDto changePassword(changePasswordDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AuthenticationApi();
final changePasswordDto = ChangePasswordDto(); // ChangePasswordDto | 

try {
    final result = api_instance.changePassword(changePasswordDto);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->changePassword: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **changePasswordDto** | [**ChangePasswordDto**](ChangePasswordDto.md)|  | 

### Return type

[**UserResponseDto**](UserResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **login**
> LoginResponseDto login(loginCredentialDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthenticationApi();
final loginCredentialDto = LoginCredentialDto(); // LoginCredentialDto | 

try {
    final result = api_instance.login(loginCredentialDto);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->login: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **loginCredentialDto** | [**LoginCredentialDto**](LoginCredentialDto.md)|  | 

### Return type

[**LoginResponseDto**](LoginResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logout**
> LogoutResponseDto logout()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthenticationApi();

try {
    final result = api_instance.logout();
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->logout: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**LogoutResponseDto**](LogoutResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **validateAccessToken**
> ValidateAccessTokenResponseDto validateAccessToken()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AuthenticationApi();

try {
    final result = api_instance.validateAccessToken();
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->validateAccessToken: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ValidateAccessTokenResponseDto**](ValidateAccessTokenResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

