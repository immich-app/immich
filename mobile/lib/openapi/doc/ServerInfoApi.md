# openapi.api.ServerInfoApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getServerInfo**](ServerInfoApi.md#getserverinfo) | **GET** /server-info | 
[**getServerVersion**](ServerInfoApi.md#getserverversion) | **GET** /server-info/version | 
[**pingServer**](ServerInfoApi.md#pingserver) | **GET** /server-info/ping | 


# **getServerInfo**
> ServerInfoResponseDto getServerInfo()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerInfoApi();

try {
    final result = api_instance.getServerInfo();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->getServerInfo: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerInfoResponseDto**](ServerInfoResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getServerVersion**
> ServerVersionReponseDto getServerVersion()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerInfoApi();

try {
    final result = api_instance.getServerVersion();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->getServerVersion: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ServerVersionReponseDto**](ServerVersionReponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **pingServer**
> ServerPingResponse pingServer()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ServerInfoApi();

try {
    final result = api_instance.pingServer();
    print(result);
} catch (e) {
    print('Exception when calling ServerInfoApi->pingServer: $e\n');
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

