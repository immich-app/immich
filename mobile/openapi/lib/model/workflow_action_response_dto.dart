//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowActionResponseDto {
  /// Returns a new [WorkflowActionResponseDto] instance.
  WorkflowActionResponseDto({
    required this.actionConfig,
    required this.id,
    required this.order,
    required this.pluginActionId,
    required this.workflowId,
  });

  Object? actionConfig;

  String id;

  num order;

  String pluginActionId;

  String workflowId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowActionResponseDto &&
    other.actionConfig == actionConfig &&
    other.id == id &&
    other.order == order &&
    other.pluginActionId == pluginActionId &&
    other.workflowId == workflowId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (actionConfig == null ? 0 : actionConfig!.hashCode) +
    (id.hashCode) +
    (order.hashCode) +
    (pluginActionId.hashCode) +
    (workflowId.hashCode);

  @override
  String toString() => 'WorkflowActionResponseDto[actionConfig=$actionConfig, id=$id, order=$order, pluginActionId=$pluginActionId, workflowId=$workflowId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.actionConfig != null) {
      json[r'actionConfig'] = this.actionConfig;
    } else {
    //  json[r'actionConfig'] = null;
    }
      json[r'id'] = this.id;
      json[r'order'] = this.order;
      json[r'pluginActionId'] = this.pluginActionId;
      json[r'workflowId'] = this.workflowId;
    return json;
  }

  /// Returns a new [WorkflowActionResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowActionResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowActionResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowActionResponseDto(
        actionConfig: mapValueOfType<Object>(json, r'actionConfig'),
        id: mapValueOfType<String>(json, r'id')!,
        order: num.parse('${json[r'order']}'),
        pluginActionId: mapValueOfType<String>(json, r'pluginActionId')!,
        workflowId: mapValueOfType<String>(json, r'workflowId')!,
      );
    }
    return null;
  }

  static List<WorkflowActionResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowActionResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowActionResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowActionResponseDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowActionResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowActionResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowActionResponseDto-objects as value to a dart map
  static Map<String, List<WorkflowActionResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowActionResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowActionResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'actionConfig',
    'id',
    'order',
    'pluginActionId',
    'workflowId',
  };
}

