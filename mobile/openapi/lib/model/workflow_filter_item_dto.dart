//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowFilterItemDto {
  /// Returns a new [WorkflowFilterItemDto] instance.
  WorkflowFilterItemDto({
    this.filterConfig,
    required this.pluginFilterId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Object? filterConfig;

  String pluginFilterId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowFilterItemDto &&
    other.filterConfig == filterConfig &&
    other.pluginFilterId == pluginFilterId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (filterConfig == null ? 0 : filterConfig!.hashCode) +
    (pluginFilterId.hashCode);

  @override
  String toString() => 'WorkflowFilterItemDto[filterConfig=$filterConfig, pluginFilterId=$pluginFilterId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.filterConfig != null) {
      json[r'filterConfig'] = this.filterConfig;
    } else {
    //  json[r'filterConfig'] = null;
    }
      json[r'pluginFilterId'] = this.pluginFilterId;
    return json;
  }

  /// Returns a new [WorkflowFilterItemDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowFilterItemDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowFilterItemDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowFilterItemDto(
        filterConfig: mapValueOfType<Object>(json, r'filterConfig'),
        pluginFilterId: mapValueOfType<String>(json, r'pluginFilterId')!,
      );
    }
    return null;
  }

  static List<WorkflowFilterItemDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowFilterItemDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowFilterItemDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowFilterItemDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowFilterItemDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowFilterItemDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowFilterItemDto-objects as value to a dart map
  static Map<String, List<WorkflowFilterItemDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowFilterItemDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowFilterItemDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'pluginFilterId',
  };
}

