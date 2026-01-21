//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowActionItemDto {
  /// Returns a new [WorkflowActionItemDto] instance.
  WorkflowActionItemDto({
    this.actionConfig,
    required this.pluginActionId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Object? actionConfig;

  String pluginActionId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowActionItemDto &&
    other.actionConfig == actionConfig &&
    other.pluginActionId == pluginActionId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (actionConfig == null ? 0 : actionConfig!.hashCode) +
    (pluginActionId.hashCode);

  @override
  String toString() => 'WorkflowActionItemDto[actionConfig=$actionConfig, pluginActionId=$pluginActionId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.actionConfig != null) {
      json[r'actionConfig'] = this.actionConfig;
    } else {
    //  json[r'actionConfig'] = null;
    }
      json[r'pluginActionId'] = this.pluginActionId;
    return json;
  }

  /// Returns a new [WorkflowActionItemDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowActionItemDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowActionItemDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowActionItemDto(
        actionConfig: mapValueOfType<Object>(json, r'actionConfig'),
        pluginActionId: mapValueOfType<String>(json, r'pluginActionId')!,
      );
    }
    return null;
  }

  static List<WorkflowActionItemDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowActionItemDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowActionItemDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowActionItemDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowActionItemDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowActionItemDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowActionItemDto-objects as value to a dart map
  static Map<String, List<WorkflowActionItemDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowActionItemDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowActionItemDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'pluginActionId',
  };
}

