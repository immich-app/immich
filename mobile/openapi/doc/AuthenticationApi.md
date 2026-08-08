# openapi.api.AuthenticationApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**changePassword**](AuthenticationApi.md#changepassword) | **POST** /auth/change-password | Change password
[**changePinCode**](AuthenticationApi.md#changepincode) | **PUT** /auth/pin-code | Change pin code
[**finishOAuth**](AuthenticationApi.md#finishoauth) | **POST** /oauth/callback | Finish OAuth
[**getAuthStatus**](AuthenticationApi.md#getauthstatus) | **GET** /auth/status | Retrieve auth status
[**linkOAuthAccount**](AuthenticationApi.md#linkoauthaccount) | **POST** /oauth/link | Link OAuth account
[**lockAuthSession**](AuthenticationApi.md#lockauthsession) | **POST** /auth/session/lock | Lock auth session
[**login**](AuthenticationApi.md#login) | **POST** /auth/login | Login
[**logout**](AuthenticationApi.md#logout) | **POST** /auth/logout | Logout
[**logoutOAuth**](AuthenticationApi.md#logoutoauth) | **POST** /oauth/backchannel-logout | Backchannel OAuth logout
[**redirectOAuthToMobile**](AuthenticationApi.md#redirectoauthtomobile) | **GET** /oauth/mobile-redirect | Redirect OAuth to mobile
[**resetPinCode**](AuthenticationApi.md#resetpincode) | **DELETE** /auth/pin-code | Reset pin code
[**setupPinCode**](AuthenticationApi.md#setuppincode) | **POST** /auth/pin-code | Setup pin code
[**signUpAdmin**](AuthenticationApi.md#signupadmin) | **POST** /auth/admin-sign-up | Register admin
[**startOAuth**](AuthenticationApi.md#startoauth) | **POST** /oauth/authorize | Start OAuth
[**unlinkOAuthAccount**](AuthenticationApi.md#unlinkoauthaccount) | **POST** /oauth/unlink | Unlink OAuth account
[**unlockAuthSession**](AuthenticationApi.md#unlockauthsession) | **POST** /auth/session/unlock | Unlock auth session
[**validateAccessToken**](AuthenticationApi.md#validateaccesstoken) | **POST** /auth/validateToken | Validate access token


# **changePassword**
> UserAdminResponseDto changePassword(changePasswordDto)

Change password

Change the password of the current user.

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

[**UserAdminResponseDto**](UserAdminResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **changePinCode**
> changePinCode(pinCodeChangeDto)

Change pin code

Change the pin code for the current user.

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

final api_instance = AuthenticationApi();
final pinCodeChangeDto = PinCodeChangeDto(); // PinCodeChangeDto | 

try {
    api_instance.changePinCode(pinCodeChangeDto);
} catch (e) {
    print('Exception when calling AuthenticationApi->changePinCode: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pinCodeChangeDto** | [**PinCodeChangeDto**](PinCodeChangeDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **finishOAuth**
> LoginResponseDto finishOAuth(oAuthCallbackDto)

Finish OAuth

Complete the OAuth authorization process by exchanging the authorization code for a session token.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthenticationApi();
final oAuthCallbackDto = OAuthCallbackDto(); // OAuthCallbackDto | 

try {
    final result = api_instance.finishOAuth(oAuthCallbackDto);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->finishOAuth: $e\n');
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

# **getAuthStatus**
> AuthStatusResponseDto getAuthStatus()

Retrieve auth status

Get information about the current session, including whether the user has a password, and if the session can access locked assets.

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

final api_instance = AuthenticationApi();

try {
    final result = api_instance.getAuthStatus();
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->getAuthStatus: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AuthStatusResponseDto**](AuthStatusResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **linkOAuthAccount**
> UserAdminResponseDto linkOAuthAccount(oAuthCallbackDto)

Link OAuth account

Link an OAuth account to the authenticated user.

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

final api_instance = AuthenticationApi();
final oAuthCallbackDto = OAuthCallbackDto(); // OAuthCallbackDto | 

try {
    final result = api_instance.linkOAuthAccount(oAuthCallbackDto);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->linkOAuthAccount: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **oAuthCallbackDto** | [**OAuthCallbackDto**](OAuthCallbackDto.md)|  | 

### Return type

[**UserAdminResponseDto**](UserAdminResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **lockAuthSession**
> lockAuthSession()

Lock auth session

Remove elevated access to locked assets from the current session.

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

final api_instance = AuthenticationApi();

try {
    api_instance.lockAuthSession();
} catch (e) {
    print('Exception when calling AuthenticationApi->lockAuthSession: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **login**
> LoginResponseDto login(loginCredentialDto)

Login

Login with username and password and receive a session token.

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

Logout

Logout the current user and invalidate the session token.

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

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logoutOAuth**
> logoutOAuth(logoutToken)

Backchannel OAuth logout

Logout the OAuth account and invalidate the session specified by the sid claim or all sessions if the sid claim is not present.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthenticationApi();
final logoutToken = logoutToken_example; // String | OAuth logout token

try {
    api_instance.logoutOAuth(logoutToken);
} catch (e) {
    print('Exception when calling AuthenticationApi->logoutOAuth: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **logoutToken** | **String**| OAuth logout token | 

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/x-www-form-urlencoded
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **redirectOAuthToMobile**
> redirectOAuthToMobile()

Redirect OAuth to mobile

Requests to this URL are automatically forwarded to the mobile app, and is used in some cases for OAuth redirecting.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthenticationApi();

try {
    api_instance.redirectOAuthToMobile();
} catch (e) {
    print('Exception when calling AuthenticationApi->redirectOAuthToMobile: $e\n');
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

# **resetPinCode**
> resetPinCode(pinCodeResetDto)

Reset pin code

Reset the pin code for the current user by providing the account password

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

final api_instance = AuthenticationApi();
final pinCodeResetDto = PinCodeResetDto(); // PinCodeResetDto | 

try {
    api_instance.resetPinCode(pinCodeResetDto);
} catch (e) {
    print('Exception when calling AuthenticationApi->resetPinCode: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pinCodeResetDto** | [**PinCodeResetDto**](PinCodeResetDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setupPinCode**
> setupPinCode(pinCodeSetupDto)

Setup pin code

Setup a new pin code for the current user.

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

final api_instance = AuthenticationApi();
final pinCodeSetupDto = PinCodeSetupDto(); // PinCodeSetupDto | 

try {
    api_instance.setupPinCode(pinCodeSetupDto);
} catch (e) {
    print('Exception when calling AuthenticationApi->setupPinCode: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **pinCodeSetupDto** | [**PinCodeSetupDto**](PinCodeSetupDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **signUpAdmin**
> UserAdminResponseDto signUpAdmin(signUpDto)

Register admin

Create the first admin user in the system.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthenticationApi();
final signUpDto = SignUpDto(); // SignUpDto | 

try {
    final result = api_instance.signUpAdmin(signUpDto);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->signUpAdmin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **signUpDto** | [**SignUpDto**](SignUpDto.md)|  | 

### Return type

[**UserAdminResponseDto**](UserAdminResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **startOAuth**
> OAuthAuthorizeResponseDto startOAuth(oAuthConfigDto)

Start OAuth

Initiate the OAuth authorization process.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AuthenticationApi();
final oAuthConfigDto = OAuthConfigDto(); // OAuthConfigDto | 

try {
    final result = api_instance.startOAuth(oAuthConfigDto);
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->startOAuth: $e\n');
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
> UserAdminResponseDto unlinkOAuthAccount()

Unlink OAuth account

Unlink the OAuth account from the authenticated user.

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

final api_instance = AuthenticationApi();

try {
    final result = api_instance.unlinkOAuthAccount();
    print(result);
} catch (e) {
    print('Exception when calling AuthenticationApi->unlinkOAuthAccount: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**UserAdminResponseDto**](UserAdminResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **unlockAuthSession**
> unlockAuthSession(sessionUnlockDto)

Unlock auth session

Temporarily grant the session elevated access to locked assets by providing the correct PIN code.

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

final api_instance = AuthenticationApi();
final sessionUnlockDto = SessionUnlockDto(); // SessionUnlockDto | 

try {
    api_instance.unlockAuthSession(sessionUnlockDto);
} catch (e) {
    print('Exception when calling AuthenticationApi->unlockAuthSession: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **sessionUnlockDto** | [**SessionUnlockDto**](SessionUnlockDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **validateAccessToken**
> ValidateAccessTokenResponseDto validateAccessToken()

Validate access token

Validate the current authorization method is still valid.

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

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

