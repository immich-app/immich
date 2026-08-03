# openapi.model.PluginTemplateResponseDto

## Load the model package
```dart
import 'package:openapi/api.dart';
```

## Properties
Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**description** | **String** | Template description | 
**key** | **String** | Template key (unique across all templates) | 
**steps** | [**List<PluginTemplateStepResponseDto>**](PluginTemplateStepResponseDto.md) | Workflow steps | [default to const []]
**title** | **String** | Template title | 
**trigger** | [**WorkflowTrigger**](WorkflowTrigger.md) |  | 
**uiHints** | **List<String>** | Ui hints, for example \"smart-album\" | [default to const []]

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


