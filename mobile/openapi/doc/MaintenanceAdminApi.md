# openapi.api.MaintenanceAdminApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteIntegrityReport**](MaintenanceAdminApi.md#deleteintegrityreport) | **DELETE** /admin/integrity/report/{id} | Delete integrity report item
[**detectPriorInstall**](MaintenanceAdminApi.md#detectpriorinstall) | **GET** /admin/maintenance/detect-install | Detect existing install
[**getIntegrityReport**](MaintenanceAdminApi.md#getintegrityreport) | **GET** /admin/integrity/report | Get integrity report by type
[**getIntegrityReportCsv**](MaintenanceAdminApi.md#getintegrityreportcsv) | **GET** /admin/integrity/report/{type}/csv | Export integrity report by type as CSV
[**getIntegrityReportFile**](MaintenanceAdminApi.md#getintegrityreportfile) | **GET** /admin/integrity/report/{id}/file | Download flagged file
[**getIntegrityReportSummary**](MaintenanceAdminApi.md#getintegrityreportsummary) | **GET** /admin/integrity/summary | Get integrity report summary
[**getMaintenanceStatus**](MaintenanceAdminApi.md#getmaintenancestatus) | **GET** /admin/maintenance/status | Get maintenance mode status
[**maintenanceLogin**](MaintenanceAdminApi.md#maintenancelogin) | **POST** /admin/maintenance/login | Log into maintenance mode
[**setMaintenanceMode**](MaintenanceAdminApi.md#setmaintenancemode) | **POST** /admin/maintenance | Set maintenance mode


# **deleteIntegrityReport**
> deleteIntegrityReport(id)

Delete integrity report item

Delete a given report item and perform corresponding deletion (e.g. trash asset, delete file)

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

final api_instance = MaintenanceAdminApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    api_instance.deleteIntegrityReport(id);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->deleteIntegrityReport: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **detectPriorInstall**
> MaintenanceDetectInstallResponseDto detectPriorInstall()

Detect existing install

Collect integrity checks and other heuristics about local data.

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

final api_instance = MaintenanceAdminApi();

try {
    final result = api_instance.detectPriorInstall();
    print(result);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->detectPriorInstall: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**MaintenanceDetectInstallResponseDto**](MaintenanceDetectInstallResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getIntegrityReport**
> IntegrityReportResponseDto getIntegrityReport(type, cursor, limit)

Get integrity report by type

Get all flagged items by integrity report type

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

final api_instance = MaintenanceAdminApi();
final type = ; // IntegrityReport | 
final cursor = cursor_example; // String | Cursor for pagination
final limit = 56; // int | Number of items per page

try {
    final result = api_instance.getIntegrityReport(type, cursor, limit);
    print(result);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->getIntegrityReport: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | [**IntegrityReport**](.md)|  | 
 **cursor** | **String**| Cursor for pagination | [optional] 
 **limit** | **int**| Number of items per page | [optional] [default to 500]

### Return type

[**IntegrityReportResponseDto**](IntegrityReportResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getIntegrityReportCsv**
> MultipartFile getIntegrityReportCsv(type)

Export integrity report by type as CSV

Get all integrity report entries for a given type as a CSV

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

final api_instance = MaintenanceAdminApi();
final type = ; // IntegrityReport | 

try {
    final result = api_instance.getIntegrityReportCsv(type);
    print(result);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->getIntegrityReportCsv: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **type** | [**IntegrityReport**](.md)|  | 

### Return type

[**MultipartFile**](MultipartFile.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getIntegrityReportFile**
> MultipartFile getIntegrityReportFile(id)

Download flagged file

Download the untracked/broken file if one exists

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

final api_instance = MaintenanceAdminApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final result = api_instance.getIntegrityReportFile(id);
    print(result);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->getIntegrityReportFile: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**MultipartFile**](MultipartFile.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getIntegrityReportSummary**
> IntegrityReportSummaryResponseDto getIntegrityReportSummary()

Get integrity report summary

Get a count of the items flagged in each integrity report

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

final api_instance = MaintenanceAdminApi();

try {
    final result = api_instance.getIntegrityReportSummary();
    print(result);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->getIntegrityReportSummary: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**IntegrityReportSummaryResponseDto**](IntegrityReportSummaryResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getMaintenanceStatus**
> MaintenanceStatusResponseDto getMaintenanceStatus()

Get maintenance mode status

Fetch information about the currently running maintenance action.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = MaintenanceAdminApi();

try {
    final result = api_instance.getMaintenanceStatus();
    print(result);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->getMaintenanceStatus: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**MaintenanceStatusResponseDto**](MaintenanceStatusResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **maintenanceLogin**
> MaintenanceAuthDto maintenanceLogin(maintenanceLoginDto)

Log into maintenance mode

Login with maintenance token or cookie to receive current information and perform further actions.

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = MaintenanceAdminApi();
final maintenanceLoginDto = MaintenanceLoginDto(); // MaintenanceLoginDto | 

try {
    final result = api_instance.maintenanceLogin(maintenanceLoginDto);
    print(result);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->maintenanceLogin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **maintenanceLoginDto** | [**MaintenanceLoginDto**](MaintenanceLoginDto.md)|  | 

### Return type

[**MaintenanceAuthDto**](MaintenanceAuthDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **setMaintenanceMode**
> setMaintenanceMode(setMaintenanceModeDto)

Set maintenance mode

Put Immich into or take it out of maintenance mode

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

final api_instance = MaintenanceAdminApi();
final setMaintenanceModeDto = SetMaintenanceModeDto(); // SetMaintenanceModeDto | 

try {
    api_instance.setMaintenanceMode(setMaintenanceModeDto);
} catch (e) {
    print('Exception when calling MaintenanceAdminApi->setMaintenanceMode: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **setMaintenanceModeDto** | [**SetMaintenanceModeDto**](SetMaintenanceModeDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

