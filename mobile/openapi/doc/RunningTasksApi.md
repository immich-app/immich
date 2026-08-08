# openapi.api.RunningTasksApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**cancelTask**](RunningTasksApi.md#canceltask) | **POST** /yucca/tasks/{parentId}/cancel | 
[**getRunningTasks**](RunningTasksApi.md#getrunningtasks) | **GET** /yucca/tasks | 


# **cancelTask**
> cancelTask(parentId)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RunningTasksApi();
final parentId = parentId_example; // String | 

try {
    api_instance.cancelTask(parentId);
} catch (e) {
    print('Exception when calling RunningTasksApi->cancelTask: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **parentId** | **String**|  | 

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRunningTasks**
> RunningTaskListResponse getRunningTasks()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RunningTasksApi();

try {
    final result = api_instance.getRunningTasks();
    print(result);
} catch (e) {
    print('Exception when calling RunningTasksApi->getRunningTasks: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**RunningTaskListResponse**](RunningTaskListResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

