# openapi.api.DevelopmentApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**resetOrchestrator**](DevelopmentApi.md#resetorchestrator) | **POST** /yucca/debug/reset | 


# **resetOrchestrator**
> resetOrchestrator()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = DevelopmentApi();

try {
    api_instance.resetOrchestrator();
} catch (e) {
    print('Exception when calling DevelopmentApi->resetOrchestrator: $e\n');
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

