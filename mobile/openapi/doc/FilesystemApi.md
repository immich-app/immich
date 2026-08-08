# openapi.api.FilesystemApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getFileListing**](FilesystemApi.md#getfilelisting) | **GET** /yucca/fs | 


# **getFileListing**
> FilesystemListingResponseDto getFileListing(path)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = FilesystemApi();
final path = path_example; // String | 

try {
    final result = api_instance.getFileListing(path);
    print(result);
} catch (e) {
    print('Exception when calling FilesystemApi->getFileListing: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **path** | **String**|  | [optional] 

### Return type

[**FilesystemListingResponseDto**](FilesystemListingResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

