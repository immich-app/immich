# openapi.model.NotificationCreateDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**data** | **Optional<Map<String, Object>?>** | Additional notification data | [optional] [default to const {}]
**description** | **Optional<String?>** | Notification description | [optional] 
**level** | [**Optional<NotificationLevel?>**](NotificationLevel.md) |  | [optional] 
**readAt** | [**Optional<DateTime?>**](DateTime.md) | Date when notification was read | [optional] 
**title** | **String** | Notification title | 
**type** | [**Optional<NotificationType?>**](NotificationType.md) |  | [optional] 
**userId** | **String** | User ID to send notification to | 

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


