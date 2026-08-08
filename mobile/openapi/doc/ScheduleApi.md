# openapi.api.ScheduleApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createSchedule**](ScheduleApi.md#createschedule) | **POST** /yucca/schedule | 
[**getSchedules**](ScheduleApi.md#getschedules) | **GET** /yucca/schedule | 
[**removeSchedule**](ScheduleApi.md#removeschedule) | **DELETE** /yucca/schedule/{id} | 
[**updateSchedule**](ScheduleApi.md#updateschedule) | **PATCH** /yucca/schedule/{id} | 


# **createSchedule**
> ScheduleCreateResponseDto createSchedule(scheduleCreateRequestDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ScheduleApi();
final scheduleCreateRequestDto = ScheduleCreateRequestDto(); // ScheduleCreateRequestDto | 

try {
    final result = api_instance.createSchedule(scheduleCreateRequestDto);
    print(result);
} catch (e) {
    print('Exception when calling ScheduleApi->createSchedule: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **scheduleCreateRequestDto** | [**ScheduleCreateRequestDto**](ScheduleCreateRequestDto.md)|  | 

### Return type

[**ScheduleCreateResponseDto**](ScheduleCreateResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getSchedules**
> ScheduleListResponseDto getSchedules()



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ScheduleApi();

try {
    final result = api_instance.getSchedules();
    print(result);
} catch (e) {
    print('Exception when calling ScheduleApi->getSchedules: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ScheduleListResponseDto**](ScheduleListResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **removeSchedule**
> removeSchedule(id)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ScheduleApi();
final id = id_example; // String | 

try {
    api_instance.removeSchedule(id);
} catch (e) {
    print('Exception when calling ScheduleApi->removeSchedule: $e\n');
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

# **updateSchedule**
> ScheduleUpdateResponseDto updateSchedule(id, scheduleUpdateRequestDto)



### Example
```dart
import 'package:openapi/api.dart';

final api_instance = ScheduleApi();
final id = id_example; // String | 
final scheduleUpdateRequestDto = ScheduleUpdateRequestDto(); // ScheduleUpdateRequestDto | 

try {
    final result = api_instance.updateSchedule(id, scheduleUpdateRequestDto);
    print(result);
} catch (e) {
    print('Exception when calling ScheduleApi->updateSchedule: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 
 **scheduleUpdateRequestDto** | [**ScheduleUpdateRequestDto**](ScheduleUpdateRequestDto.md)|  | 

### Return type

[**ScheduleUpdateResponseDto**](ScheduleUpdateResponseDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

