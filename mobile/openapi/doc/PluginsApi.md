# openapi.api.PluginsApi

## Load the API package
```dart
import 'package:openapi/api.dart';
```

All URIs are relative to */api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getPlugin**](PluginsApi.md#getplugin) | **GET** /plugins/{id} | Retrieve a plugin
[**searchPluginMethods**](PluginsApi.md#searchpluginmethods) | **GET** /plugins/methods | Retrieve plugin methods
[**searchPluginTemplates**](PluginsApi.md#searchplugintemplates) | **GET** /plugins/templates | Retrieve workflow templates
[**searchPlugins**](PluginsApi.md#searchplugins) | **GET** /plugins | List all plugins


# **getPlugin**
> PluginResponseDto getPlugin(id)

Retrieve a plugin

Retrieve information about a specific plugin by its ID.

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

final api_instance = PluginsApi();
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | 

try {
    final result = api_instance.getPlugin(id);
    print(result);
} catch (e) {
    print('Exception when calling PluginsApi->getPlugin: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**|  | 

### Return type

[**PluginResponseDto**](PluginResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchPluginMethods**
> List<PluginMethodResponseDto> searchPluginMethods(description, enabled, id, name, pluginName, pluginVersion, title, trigger, type)

Retrieve plugin methods

Retrieve a list of plugin methods

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

final api_instance = PluginsApi();
final description = description_example; // String | 
final enabled = true; // bool | Whether the plugin method is enabled
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Plugin method ID
final name = name_example; // String | 
final pluginName = pluginName_example; // String | Plugin name
final pluginVersion = pluginVersion_example; // String | Plugin version
final title = title_example; // String | 
final trigger = ; // WorkflowTrigger | Workflow trigger
final type = ; // WorkflowType | Workflow types

try {
    final result = api_instance.searchPluginMethods(description, enabled, id, name, pluginName, pluginVersion, title, trigger, type);
    print(result);
} catch (e) {
    print('Exception when calling PluginsApi->searchPluginMethods: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **description** | **String**|  | [optional] 
 **enabled** | **bool**| Whether the plugin method is enabled | [optional] 
 **id** | **String**| Plugin method ID | [optional] 
 **name** | **String**|  | [optional] 
 **pluginName** | **String**| Plugin name | [optional] 
 **pluginVersion** | **String**| Plugin version | [optional] 
 **title** | **String**|  | [optional] 
 **trigger** | [**WorkflowTrigger**](.md)| Workflow trigger | [optional] 
 **type** | [**WorkflowType**](.md)| Workflow types | [optional] 

### Return type

[**List<PluginMethodResponseDto>**](PluginMethodResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchPluginTemplates**
> List<PluginTemplateResponseDto> searchPluginTemplates()

Retrieve workflow templates

Retrieve workflow templates provided by installed plugins

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

final api_instance = PluginsApi();

try {
    final result = api_instance.searchPluginTemplates();
    print(result);
} catch (e) {
    print('Exception when calling PluginsApi->searchPluginTemplates: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**List<PluginTemplateResponseDto>**](PluginTemplateResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **searchPlugins**
> List<PluginResponseDto> searchPlugins(description, enabled, id, name, title, version)

List all plugins

Retrieve a list of plugins available to the authenticated user.

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

final api_instance = PluginsApi();
final description = description_example; // String | 
final enabled = true; // bool | Whether the plugin is enabled
final id = 38400000-8cf0-11bd-b23e-10b96e4ef00d; // String | Plugin ID
final name = name_example; // String | 
final title = title_example; // String | 
final version = version_example; // String | 

try {
    final result = api_instance.searchPlugins(description, enabled, id, name, title, version);
    print(result);
} catch (e) {
    print('Exception when calling PluginsApi->searchPlugins: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **description** | **String**|  | [optional] 
 **enabled** | **bool**| Whether the plugin is enabled | [optional] 
 **id** | **String**| Plugin ID | [optional] 
 **name** | **String**|  | [optional] 
 **title** | **String**|  | [optional] 
 **version** | **String**|  | [optional] 

### Return type

[**List<PluginResponseDto>**](PluginResponseDto.md)

### Authorization

[cookie](../README.md#cookie), [api_key](../README.md#api_key), [bearer](../README.md#bearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

