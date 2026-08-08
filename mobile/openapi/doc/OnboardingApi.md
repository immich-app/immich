# openapi.api.OnboardingApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**confirmRecoveryKey**](OnboardingApi.md#confirmrecoverykey) | **POST** /yucca/onboarding/recovery-key | 
[**currentRecoveryKey**](OnboardingApi.md#currentrecoverykey) | **GET** /yucca/onboarding/recovery-key | 
[**enableTelemetry**](OnboardingApi.md#enabletelemetry) | **POST** /yucca/onboarding/telemetry | 
[**importRecoveryKey**](OnboardingApi.md#importrecoverykey) | **PUT** /yucca/onboarding/recovery-key | 
[**onboardingStatus**](OnboardingApi.md#onboardingstatus) | **GET** /yucca/onboarding | 
[**reportError**](OnboardingApi.md#reporterror) | **POST** /yucca/onboarding/report-error | 
[**skipOnboardingExtraConfig**](OnboardingApi.md#skiponboardingextraconfig) | **POST** /yucca/onboarding/skip | 


# **confirmRecoveryKey**
> confirmRecoveryKey()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OnboardingApi();

try {
    api_instance.confirmRecoveryKey();
} catch (e) {
    print('Exception when calling OnboardingApi->confirmRecoveryKey: $e\n');
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

# **currentRecoveryKey**
> CurrentRecoveryKeyResponse currentRecoveryKey()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OnboardingApi();

try {
    final result = api_instance.currentRecoveryKey();
    print(result);
} catch (e) {
    print('Exception when calling OnboardingApi->currentRecoveryKey: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**CurrentRecoveryKeyResponse**](CurrentRecoveryKeyResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **enableTelemetry**
> enableTelemetry()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OnboardingApi();

try {
    api_instance.enableTelemetry();
} catch (e) {
    print('Exception when calling OnboardingApi->enableTelemetry: $e\n');
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

# **importRecoveryKey**
> importRecoveryKey(importRecoveryKeyRequest)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OnboardingApi();
final importRecoveryKeyRequest = ImportRecoveryKeyRequest(); // ImportRecoveryKeyRequest | 

try {
    api_instance.importRecoveryKey(importRecoveryKeyRequest);
} catch (e) {
    print('Exception when calling OnboardingApi->importRecoveryKey: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **importRecoveryKeyRequest** | [**ImportRecoveryKeyRequest**](ImportRecoveryKeyRequest.md)|  | 

### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **onboardingStatus**
> OnboardingStatusResponseDto onboardingStatus()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OnboardingApi();

try {
    final result = api_instance.onboardingStatus();
    print(result);
} catch (e) {
    print('Exception when calling OnboardingApi->onboardingStatus: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**OnboardingStatusResponseDto**](OnboardingStatusResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **reportError**
> reportError()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OnboardingApi();

try {
    api_instance.reportError();
} catch (e) {
    print('Exception when calling OnboardingApi->reportError: $e\n');
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

# **skipOnboardingExtraConfig**
> skipOnboardingExtraConfig()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = OnboardingApi();

try {
    api_instance.skipOnboardingExtraConfig();
} catch (e) {
    print('Exception when calling OnboardingApi->skipOnboardingExtraConfig: $e\n');
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

