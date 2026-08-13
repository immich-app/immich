# openapi.api.ServerApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteServerLicense**](ServerApi.md#deleteserverlicense) | **DELETE** /server/license | Delete server product key
[**getAboutInfo**](ServerApi.md#getaboutinfo) | **GET** /server/about | Get server information
[**getApkLinks**](ServerApi.md#getapklinks) | **GET** /server/apk-links | Get APK links
[**getServerConfig**](ServerApi.md#getserverconfig) | **GET** /server/config | Get config
[**getServerFeatures**](ServerApi.md#getserverfeatures) | **GET** /server/features | Get features
[**getServerLicense**](ServerApi.md#getserverlicense) | **GET** /server/license | Get product key
[**getServerStatistics**](ServerApi.md#getserverstatistics) | **GET** /server/statistics | Get statistics
[**getServerVersion**](ServerApi.md#getserverversion) | **GET** /server/version | Get server version
[**getStorage**](ServerApi.md#getstorage) | **GET** /server/storage | Get storage
[**getSupportedMediaTypes**](ServerApi.md#getsupportedmediatypes) | **GET** /server/media-types | Get supported media types
[**getVersionCheck**](ServerApi.md#getversioncheck) | **GET** /server/version-check | Get version check status
[**getVersionHistory**](ServerApi.md#getversionhistory) | **GET** /server/version-history | Get version history
[**pingServer**](ServerApi.md#pingserver) | **GET** /server/ping | Ping
[**setServerLicense**](ServerApi.md#setserverlicense) | **PUT** /server/license | Set server product key


# **deleteServerLicense**
> deleteServerLicense()

Delete server product key

Delete the currently set server product key.

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

final api_instance = ServerApi();

try {
    api_instance.deleteServerLicense();
} catch (e) {
    print('Exception when calling ServerApi->deleteServerLicense: $e\n');
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

# **getAboutInfo**
> ServerAboutResponseDto getAboutInfo()

Get server information

Retrieve a list of information about the server.

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

final api_instance = ServerApi();

try {
    final result = api_instance.getAboutInfo();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getAboutInfo: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerAboutResponseDto**](ServerAboutResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getApkLinks**
> ServerApkLinksDto getApkLinks()

Get APK links

Retrieve links to the APKs for the current server version.

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

final api_instance = ServerApi();

try {
    final result = api_instance.getApkLinks();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getApkLinks: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerApkLinksDto**](ServerApkLinksDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerConfig**
> ServerConfigDto getServerConfig()

Get config

Retrieve the current server configuration.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerApi();

try {
    final result = api_instance.getServerConfig();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getServerConfig: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerConfigDto**](ServerConfigDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerFeatures**
> ServerFeaturesDto getServerFeatures()

Get features

Retrieve available features supported by this server.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerApi();

try {
    final result = api_instance.getServerFeatures();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getServerFeatures: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerFeaturesDto**](ServerFeaturesDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerLicense**
> UserLicense getServerLicense()

Get product key

Retrieve information about whether the server currently has a product key registered.

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

final api_instance = ServerApi();

try {
    final result = api_instance.getServerLicense();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getServerLicense: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**UserLicense**](UserLicense.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerStatistics**
> ServerStatsResponseDto getServerStatistics()

Get statistics

Retrieve statistics about the entire Immich instance such as asset counts.

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

final api_instance = ServerApi();

try {
    final result = api_instance.getServerStatistics();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getServerStatistics: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerStatsResponseDto**](ServerStatsResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerVersion**
> ServerVersionResponseDto getServerVersion()

Get server version

Retrieve the current server version in semantic versioning (semver) format.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerApi();

try {
    final result = api_instance.getServerVersion();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getServerVersion: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerVersionResponseDto**](ServerVersionResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getStorage**
> ServerStorageResponseDto getStorage()

Get storage

Retrieve the current storage utilization information of the server.

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

final api_instance = ServerApi();

try {
    final result = api_instance.getStorage();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getStorage: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerStorageResponseDto**](ServerStorageResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSupportedMediaTypes**
> ServerMediaTypesResponseDto getSupportedMediaTypes()

Get supported media types

Retrieve all media types supported by the server.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerApi();

try {
    final result = api_instance.getSupportedMediaTypes();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getSupportedMediaTypes: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerMediaTypesResponseDto**](ServerMediaTypesResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getVersionCheck**
> VersionCheckStateResponseDto getVersionCheck()

Get version check status

Retrieve information about the last time the version check ran.

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

final api_instance = ServerApi();

try {
    final result = api_instance.getVersionCheck();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getVersionCheck: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**VersionCheckStateResponseDto**](VersionCheckStateResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getVersionHistory**
> List<ServerVersionHistoryResponseDto> getVersionHistory()

Get version history

Retrieve a list of past versions the server has been on.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerApi();

try {
    final result = api_instance.getVersionHistory();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->getVersionHistory: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<ServerVersionHistoryResponseDto>**](ServerVersionHistoryResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **pingServer**
> ServerPingResponse pingServer()

Ping

Pong

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerApi();

try {
    final result = api_instance.pingServer();
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->pingServer: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerPingResponse**](ServerPingResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setServerLicense**
> UserLicense setServerLicense(licenseKeyDto)

Set server product key

Validate and set the server product key if successful.

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

final api_instance = ServerApi();
final licenseKeyDto = LicenseKeyDto(); // LicenseKeyDto | 

try {
    final result = api_instance.setServerLicense(licenseKeyDto);
    print(result);
} catch (e) {
    print('Exception when calling ServerApi->setServerLicense: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **licenseKeyDto** | [**LicenseKeyDto**](LicenseKeyDto.md)|  | 

### Return type

[**UserLicense**](UserLicense.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

