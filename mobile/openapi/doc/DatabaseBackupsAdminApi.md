# openapi.api.DatabaseBackupsAdminApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**deleteDatabaseBackup**](DatabaseBackupsAdminApi.md#deletedatabasebackup) | **DELETE** /admin/database-backups | Delete database backup
[**downloadDatabaseBackup**](DatabaseBackupsAdminApi.md#downloaddatabasebackup) | **GET** /admin/database-backups/{filename} | Download database backup
[**listDatabaseBackups**](DatabaseBackupsAdminApi.md#listdatabasebackups) | **GET** /admin/database-backups | List database backups
[**startDatabaseRestoreFlow**](DatabaseBackupsAdminApi.md#startdatabaserestoreflow) | **POST** /admin/database-backups/start-restore | Start database backup restore flow
[**uploadDatabaseBackup**](DatabaseBackupsAdminApi.md#uploaddatabasebackup) | **POST** /admin/database-backups/upload | Upload database backup


# **deleteDatabaseBackup**
> deleteDatabaseBackup(databaseBackupDeleteDto)

Delete database backup

Delete a backup by its filename

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

final api_instance = DatabaseBackupsAdminApi();
final databaseBackupDeleteDto = DatabaseBackupDeleteDto(); // DatabaseBackupDeleteDto | 

try {
    api_instance.deleteDatabaseBackup(databaseBackupDeleteDto);
} catch (e) {
    print('Exception when calling DatabaseBackupsAdminApi->deleteDatabaseBackup: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **databaseBackupDeleteDto** | [**DatabaseBackupDeleteDto**](DatabaseBackupDeleteDto.md)|  | 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **downloadDatabaseBackup**
> MultipartFile downloadDatabaseBackup(filename)

Download database backup

Downloads the database backup file

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

final api_instance = DatabaseBackupsAdminApi();
final filename = filename_example; // String | 

try {
    final result = api_instance.downloadDatabaseBackup(filename);
    print(result);
} catch (e) {
    print('Exception when calling DatabaseBackupsAdminApi->downloadDatabaseBackup: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **filename** | **String**|  | 

### Return type

[**MultipartFile**](MultipartFile.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listDatabaseBackups**
> DatabaseBackupListResponseDto listDatabaseBackups()

List database backups

Get the list of the successful and failed backups

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

final api_instance = DatabaseBackupsAdminApi();

try {
    final result = api_instance.listDatabaseBackups();
    print(result);
} catch (e) {
    print('Exception when calling DatabaseBackupsAdminApi->listDatabaseBackups: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**DatabaseBackupListResponseDto**](DatabaseBackupListResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **startDatabaseRestoreFlow**
> startDatabaseRestoreFlow()

Start database backup restore flow

Put Immich into maintenance mode to restore a backup (Immich must not be configured)

### Example
```dart
import 'package:openapi/api.dart';

final api_instance = DatabaseBackupsAdminApi();

try {
    api_instance.startDatabaseRestoreFlow();
} catch (e) {
    print('Exception when calling DatabaseBackupsAdminApi->startDatabaseRestoreFlow: $e\n');
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

# **uploadDatabaseBackup**
> uploadDatabaseBackup(file)

Upload database backup

Uploads .sql/.sql.gz file to restore backup from

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

final api_instance = DatabaseBackupsAdminApi();
final file = BINARY_DATA_HERE; // MultipartFile | Database backup file

try {
    api_instance.uploadDatabaseBackup(file);
} catch (e) {
    print('Exception when calling DatabaseBackupsAdminApi->uploadDatabaseBackup: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **file** | **MultipartFile**| Database backup file | [optional] 

### Return type

void (empty response body)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

