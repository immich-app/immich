# openapi.api.AdminConfigApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAdminConfig**](AdminConfigApi.md#getadminconfig) | **GET** /config/admin | 
[**putAdminConfig**](AdminConfigApi.md#putadminconfig) | **PUT** /config/admin | 


# **getAdminConfig**
> AdminConfigResponseDto getAdminConfig()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AdminConfigApi();

try {
    final result = api_instance.getAdminConfig();
    print(result);
} catch (e) {
    print('Exception when calling AdminConfigApi->getAdminConfig: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AdminConfigResponseDto**](AdminConfigResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **putAdminConfig**
> AdminConfigResponseDto putAdminConfig(body)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = AdminConfigApi();
final body = Object(); // Object | 

try {
    final result = api_instance.putAdminConfig(body);
    print(result);
} catch (e) {
    print('Exception when calling AdminConfigApi->putAdminConfig: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **Object**|  | 

### Return type

[**AdminConfigResponseDto**](AdminConfigResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

