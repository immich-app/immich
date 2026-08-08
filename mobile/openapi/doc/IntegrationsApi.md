# openapi.api.IntegrationsApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**configureImmichIntegration**](IntegrationsApi.md#configureimmichintegration) | **POST** /yucca/integrations/immich | 
[**getIntegrations**](IntegrationsApi.md#getintegrations) | **GET** /yucca/integrations | 
[**startImmichRollback**](IntegrationsApi.md#startimmichrollback) | **POST** /yucca/integrations/immich/rollback | 


# **configureImmichIntegration**
> configureImmichIntegration(configureImmichIntegrationRequestDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = IntegrationsApi();
final configureImmichIntegrationRequestDto = ConfigureImmichIntegrationRequestDto(); // ConfigureImmichIntegrationRequestDto | 

try {
    api_instance.configureImmichIntegration(configureImmichIntegrationRequestDto);
} catch (e) {
    print('Exception when calling IntegrationsApi->configureImmichIntegration: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **configureImmichIntegrationRequestDto** | [**ConfigureImmichIntegrationRequestDto**](ConfigureImmichIntegrationRequestDto.md)|  | 

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getIntegrations**
> IntegrationsResponseDto getIntegrations()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = IntegrationsApi();

try {
    final result = api_instance.getIntegrations();
    print(result);
} catch (e) {
    print('Exception when calling IntegrationsApi->getIntegrations: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**IntegrationsResponseDto**](IntegrationsResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **startImmichRollback**
> startImmichRollback(immichRollbackRequestDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = IntegrationsApi();
final immichRollbackRequestDto = ImmichRollbackRequestDto(); // ImmichRollbackRequestDto | 

try {
    api_instance.startImmichRollback(immichRollbackRequestDto);
} catch (e) {
    print('Exception when calling IntegrationsApi->startImmichRollback: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **immichRollbackRequestDto** | [**ImmichRollbackRequestDto**](ImmichRollbackRequestDto.md)|  | 

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

