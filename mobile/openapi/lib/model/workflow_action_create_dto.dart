//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowActionCreateDto {
  /// Returns a new [WorkflowActionCreateDto] instance.
  WorkflowActionCreateDto({
    this.actionConfig,
    required this.actionId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Object? actionConfig;

  String actionId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowActionCreateDto &&
    other.actionConfig == actionConfig &&
    other.actionId == actionId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (actionConfig == null ? 0 : actionConfig!.hashCode) +
    (actionId.hashCode);

  @override
  String toString() => 'WorkflowActionCreateDto[actionConfig=$actionConfig, actionId=$actionId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.actionConfig != null) {
      json[r'actionConfig'] = this.actionConfig;
    } else {
    //  json[r'actionConfig'] = null;
    }
      json[r'actionId'] = this.actionId;
    return json;
  }

  /// Returns a new [WorkflowActionCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowActionCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowActionCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowActionCreateDto(
        actionConfig: mapValueOfType<Object>(json, r'actionConfig'),
        actionId: mapValueOfType<String>(json, r'actionId')!,
      );
    }
    return null;
  }

  static List<WorkflowActionCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowActionCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowActionCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowActionCreateDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowActionCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowActionCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowActionCreateDto-objects as value to a dart map
  static Map<String, List<WorkflowActionCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowActionCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowActionCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'actionId',
  };
}

