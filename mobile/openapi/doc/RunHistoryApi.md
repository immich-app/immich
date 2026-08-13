# openapi.api.RunHistoryApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getRun**](RunHistoryApi.md#getrun) | **GET** /yucca/logs/{id} | 
[**logStreamSse**](RunHistoryApi.md#logstreamsse) | **GET** /yucca/logs/{id}/stream | 


# **getRun**
> RunResponseDto getRun(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RunHistoryApi();
final id = id_example; // String | 

try {
    final result = api_instance.getRun(id);
    print(result);
} catch (e) {
    print('Exception when calling RunHistoryApi->getRun: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**RunResponseDto**](RunResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **logStreamSse**
> logStreamSse(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = RunHistoryApi();
final id = id_example; // String | 

try {
    api_instance.logStreamSse(id);
} catch (e) {
    print('Exception when calling RunHistoryApi->logStreamSse: $e\n');
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

