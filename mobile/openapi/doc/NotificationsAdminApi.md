# openapi.api.NotificationsAdminApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createNotification**](NotificationsAdminApi.md#createnotification) | **POST** /admin/notifications | Create a notification
[**getNotificationTemplateAdmin**](NotificationsAdminApi.md#getnotificationtemplateadmin) | **POST** /admin/notifications/templates/{name} | Render email template
[**sendTestEmailAdmin**](NotificationsAdminApi.md#sendtestemailadmin) | **POST** /admin/notifications/test-email | Send test email


# **createNotification**
> NotificationDto createNotification(notificationCreateDto)

Create a notification

Create a new notification for a specific user.

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = NotificationsAdminApi();
final notificationCreateDto = NotificationCreateDto(); // NotificationCreateDto | 

try {
    final result = api_instance.createNotification(notificationCreateDto);
    print(result);
} catch (e) {
    print('Exception when calling NotificationsAdminApi->createNotification: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **notificationCreateDto** | [**NotificationCreateDto**](NotificationCreateDto.md)|  | 

### Return type

[**NotificationDto**](NotificationDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getNotificationTemplateAdmin**
> TemplateResponseDto getNotificationTemplateAdmin(name, templateDto)

Render email template

Retrieve a preview of the provided email template.

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = NotificationsAdminApi();
final name = name_example; // String | 
final templateDto = TemplateDto(); // TemplateDto | 

try {
    final result = api_instance.getNotificationTemplateAdmin(name, templateDto);
    print(result);
} catch (e) {
    print('Exception when calling NotificationsAdminApi->getNotificationTemplateAdmin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **name** | **String**|  | 
 **templateDto** | [**TemplateDto**](TemplateDto.md)|  | 

### Return type

[**TemplateResponseDto**](TemplateResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **sendTestEmailAdmin**
> TestEmailResponseDto sendTestEmailAdmin(systemConfigSmtpDto)

Send test email

Send a test email using the provided SMTP configuration.

### Example
```dart
import 'package:openapi/api.dart';
// TODO Configure API key authorization: cookie
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('cookie').apiKeyPrefix = 'Bearer';
// TODO Configure API key authorization: api_key
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKey = 'YOUR_API_KEY';
// uncomment below to setup prefix (e.g. Bearer) for API key, if needed
//defaultApiClient.getAuthentication<ApiKeyAuth>('api_key').apiKeyPrefix = 'Bearer';
// TODO Configure HTTP Bearer authorization: bearer
// Case 1. Use String Token
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken('YOUR_ACCESS_TOKEN');
// Case 2. Use Function which generate token.
// String yourTokenGeneratorFunction() { ... }
//defaultApiClient.getAuthentication<HttpBearerAuth>('bearer').setAccessToken(yourTokenGeneratorFunction);

final api_instance = NotificationsAdminApi();
final systemConfigSmtpDto = SystemConfigSmtpDto(); // SystemConfigSmtpDto | 

try {
    final result = api_instance.sendTestEmailAdmin(systemConfigSmtpDto);
    print(result);
} catch (e) {
    print('Exception when calling NotificationsAdminApi->sendTestEmailAdmin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **systemConfigSmtpDto** | [**SystemConfigSmtpDto**](SystemConfigSmtpDto.md)|  | 

### Return type

[**TestEmailResponseDto**](TestEmailResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

