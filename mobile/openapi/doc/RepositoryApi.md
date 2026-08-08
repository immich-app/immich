# openapi.api.RepositoryApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**checkImportRepository**](RepositoryApi.md#checkimportrepository) | **GET** /yucca/repository/{id}/import | 
[**createBackup**](RepositoryApi.md#createbackup) | **POST** /yucca/repository/{id} | 
[**createRepository**](RepositoryApi.md#createrepository) | **POST** /yucca/repository | 
[**deleteRepository**](RepositoryApi.md#deleterepository) | **DELETE** /yucca/repository/{id} | 
[**forgetSnapshot**](RepositoryApi.md#forgetsnapshot) | **DELETE** /yucca/repository/{id}/snapshots/{snapshot} | 
[**getRepositories**](RepositoryApi.md#getrepositories) | **GET** /yucca/repository | 
[**getRunHistory**](RepositoryApi.md#getrunhistory) | **GET** /yucca/repository/{id}/runs | 
[**getSnapshotListing**](RepositoryApi.md#getsnapshotlisting) | **GET** /yucca/repository/{id}/snapshots/{snapshot}/listing | 
[**getSnapshots**](RepositoryApi.md#getsnapshots) | **GET** /yucca/repository/{id}/snapshots | 
[**importRepository**](RepositoryApi.md#importrepository) | **POST** /yucca/repository/{id}/import | 
[**inspectRepositories**](RepositoryApi.md#inspectrepositories) | **GET** /yucca/repository/inspect | 
[**pruneRepository**](RepositoryApi.md#prunerepository) | **POST** /yucca/repository/{id}/snapshots/prune | 
[**reconfigureRepositoryPrimaryBackend**](RepositoryApi.md#reconfigurerepositoryprimarybackend) | **PUT** /yucca/repository/{id}/backend | 
[**restoreFromPoint**](RepositoryApi.md#restorefrompoint) | **POST** /yucca/repository/{id}/snapshots/{snapshot}/restore-from-point | 
[**restoreSnapshot**](RepositoryApi.md#restoresnapshot) | **POST** /yucca/repository/{id}/snapshots/{snapshot} | 
[**updateRepository**](RepositoryApi.md#updaterepository) | **PATCH** /yucca/repository/{id} | 


# **checkImportRepository**
> RepositoryCheckImportResponseDto checkImportRepository(backend, id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final backend = backend_example; // String | 
final id = id_example; // String | 

try {
    final result = api_instance.checkImportRepository(backend, id);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->checkImportRepository: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **backend** | **String**|  | 
 **id** | **String**|  | 

### Return type

[**RepositoryCheckImportResponseDto**](RepositoryCheckImportResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createBackup**
> LogResponseDto createBackup(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 

try {
    final result = api_instance.createBackup(id);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->createBackup: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**LogResponseDto**](LogResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createRepository**
> RepositoryCreateResponseDto createRepository(repositoryCreateRequestDto, backend)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final repositoryCreateRequestDto = RepositoryCreateRequestDto(); // RepositoryCreateRequestDto | 
final backend = backend_example; // String | 

try {
    final result = api_instance.createRepository(repositoryCreateRequestDto, backend);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->createRepository: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **repositoryCreateRequestDto** | [**RepositoryCreateRequestDto**](RepositoryCreateRequestDto.md)|  | 
 **backend** | **String**|  | [optional] 

### Return type

[**RepositoryCreateResponseDto**](RepositoryCreateResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRepository**
> deleteRepository(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 

try {
    api_instance.deleteRepository(id);
} catch (e) {
    print('Exception when calling RepositoryApi->deleteRepository: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **forgetSnapshot**
> ListSnapshotsResponseDto forgetSnapshot(id, snapshot)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 
final snapshot = snapshot_example; // String | 

try {
    final result = api_instance.forgetSnapshot(id, snapshot);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->forgetSnapshot: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **snapshot** | **String**|  | 

### Return type

[**ListSnapshotsResponseDto**](ListSnapshotsResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRepositories**
> RepositoryListResponseDto getRepositories()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();

try {
    final result = api_instance.getRepositories();
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->getRepositories: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**RepositoryListResponseDto**](RepositoryListResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRunHistory**
> RunHistoryResponseDto getRunHistory(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 

try {
    final result = api_instance.getRunHistory(id);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->getRunHistory: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**RunHistoryResponseDto**](RunHistoryResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSnapshotListing**
> FilesystemListingResponseDto getSnapshotListing(id, snapshot, path)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 
final snapshot = snapshot_example; // String | 
final path = path_example; // String | 

try {
    final result = api_instance.getSnapshotListing(id, snapshot, path);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->getSnapshotListing: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **snapshot** | **String**|  | 
 **path** | **String**|  | [optional] 

### Return type

[**FilesystemListingResponseDto**](FilesystemListingResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSnapshots**
> ListSnapshotsResponseDto getSnapshots(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 

try {
    final result = api_instance.getSnapshots(id);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->getSnapshots: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**ListSnapshotsResponseDto**](ListSnapshotsResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **importRepository**
> RepositoryCreateResponseDto importRepository(backend, id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final backend = backend_example; // String | 
final id = id_example; // String | 

try {
    final result = api_instance.importRepository(backend, id);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->importRepository: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **backend** | **String**|  | 
 **id** | **String**|  | 

### Return type

[**RepositoryCreateResponseDto**](RepositoryCreateResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **inspectRepositories**
> RepositoryInspectResponseDto inspectRepositories(backend)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final backend = backend_example; // String | 

try {
    final result = api_instance.inspectRepositories(backend);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->inspectRepositories: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **backend** | **String**|  | [optional] 

### Return type

[**RepositoryInspectResponseDto**](RepositoryInspectResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **pruneRepository**
> LogResponseDto pruneRepository(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 

try {
    final result = api_instance.pruneRepository(id);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->pruneRepository: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**LogResponseDto**](LogResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **reconfigureRepositoryPrimaryBackend**
> RepositoryCreateResponseDto reconfigureRepositoryPrimaryBackend(id, repositoryPrimaryBackendReconfigureRequestDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 
final repositoryPrimaryBackendReconfigureRequestDto = RepositoryPrimaryBackendReconfigureRequestDto(); // RepositoryPrimaryBackendReconfigureRequestDto | 

try {
    final result = api_instance.reconfigureRepositoryPrimaryBackend(id, repositoryPrimaryBackendReconfigureRequestDto);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->reconfigureRepositoryPrimaryBackend: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **repositoryPrimaryBackendReconfigureRequestDto** | [**RepositoryPrimaryBackendReconfigureRequestDto**](RepositoryPrimaryBackendReconfigureRequestDto.md)|  | 

### Return type

[**RepositoryCreateResponseDto**](RepositoryCreateResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **restoreFromPoint**
> LogResponseDto restoreFromPoint(backend, id, snapshot, repositorySnapshotRestoreFromPointRequestDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final backend = backend_example; // String | 
final id = id_example; // String | 
final snapshot = snapshot_example; // String | 
final repositorySnapshotRestoreFromPointRequestDto = RepositorySnapshotRestoreFromPointRequestDto(); // RepositorySnapshotRestoreFromPointRequestDto | 

try {
    final result = api_instance.restoreFromPoint(backend, id, snapshot, repositorySnapshotRestoreFromPointRequestDto);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->restoreFromPoint: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **backend** | **String**|  | 
 **id** | **String**|  | 
 **snapshot** | **String**|  | 
 **repositorySnapshotRestoreFromPointRequestDto** | [**RepositorySnapshotRestoreFromPointRequestDto**](RepositorySnapshotRestoreFromPointRequestDto.md)|  | 

### Return type

[**LogResponseDto**](LogResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **restoreSnapshot**
> LogResponseDto restoreSnapshot(id, snapshot, repositorySnapshotRestoreRequestDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 
final snapshot = snapshot_example; // String | 
final repositorySnapshotRestoreRequestDto = RepositorySnapshotRestoreRequestDto(); // RepositorySnapshotRestoreRequestDto | 

try {
    final result = api_instance.restoreSnapshot(id, snapshot, repositorySnapshotRestoreRequestDto);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->restoreSnapshot: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **snapshot** | **String**|  | 
 **repositorySnapshotRestoreRequestDto** | [**RepositorySnapshotRestoreRequestDto**](RepositorySnapshotRestoreRequestDto.md)|  | 

### Return type

[**LogResponseDto**](LogResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateRepository**
> RepositoryUpdateResponseDto updateRepository(id, repositoryUpdateRequestDto, backend)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RepositoryApi();
final id = id_example; // String | 
final repositoryUpdateRequestDto = RepositoryUpdateRequestDto(); // RepositoryUpdateRequestDto | 
final backend = backend_example; // String | 

try {
    final result = api_instance.updateRepository(id, repositoryUpdateRequestDto, backend);
    print(result);
} catch (e) {
    print('Exception when calling RepositoryApi->updateRepository: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **repositoryUpdateRequestDto** | [**RepositoryUpdateRequestDto**](RepositoryUpdateRequestDto.md)|  | 
 **backend** | **String**|  | [optional] 

### Return type

[**RepositoryUpdateResponseDto**](RepositoryUpdateResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

