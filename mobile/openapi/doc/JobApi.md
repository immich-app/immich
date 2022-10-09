# openapi.api.JobApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAllJobsStatus**](JobApi.md#getalljobsstatus) | **GET** /jobs | 
[**getJobStatus**](JobApi.md#getjobstatus) | **GET** /jobs/{jobId} | 
[**sendJobCommand**](JobApi.md#sendjobcommand) | **PUT** /jobs/{jobId} | 


# **getAllJobsStatus**
> AllJobStatusResponseDto getAllJobsStatus()



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = JobApi();

try {
    final result = api_instance.getAllJobsStatus();
    print(result);
} catch (e) {
    print('Exception when calling JobApi->getAllJobsStatus: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AllJobStatusResponseDto**](AllJobStatusResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getJobStatus**
> JobStatusResponseDto getJobStatus(jobId)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = JobApi();
final jobId = ; // JobId | 

try {
    final result = api_instance.getJobStatus(jobId);
    print(result);
} catch (e) {
    print('Exception when calling JobApi->getJobStatus: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **jobId** | [**JobId**](.md)|  | 

### Return type

[**JobStatusResponseDto**](JobStatusResponseDto.md)

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sendJobCommand**
> num sendJobCommand(jobId, jobCommandDto)



### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = JobApi();
final jobId = ; // JobId | 
final jobCommandDto = JobCommandDto(); // JobCommandDto | 

try {
    final result = api_instance.sendJobCommand(jobId, jobCommandDto);
    print(result);
} catch (e) {
    print('Exception when calling JobApi->sendJobCommand: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **jobId** | [**JobId**](.md)|  | 
 **jobCommandDto** | [**JobCommandDto**](JobCommandDto.md)|  | 

### Return type

**num**

### Authorization

[bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

