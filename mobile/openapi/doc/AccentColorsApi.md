# openapi.api.AccentColorsApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getColors**](AccentColorsApi.md#getcolors) | **GET** /accent-colors | 


# **getColors**
> SystemConfigDisplayDto getColors()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = AccentColorsApi();

try {
    final result = api_instance.getColors();
    print(result);
} catch (e) {
    print('Exception when calling AccentColorsApi->getColors: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**SystemConfigDisplayDto**](SystemConfigDisplayDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

