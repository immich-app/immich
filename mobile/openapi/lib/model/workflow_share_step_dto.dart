//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowShareStepDto {
  /// Returns a new [WorkflowShareStepDto] instance.
  WorkflowShareStepDto({
    this.config = const {},
    this.enabled,
    required this.method,
  });

  /// Step configuration
  Map<String, Object>? config;

  /// Step is enabled
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? enabled;

  /// Step plugin method
  String method;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowShareStepDto &&
    _deepEquality.equals(other.config, config) &&
    other.enabled == enabled &&
    other.method == method;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (config == null ? 0 : config!.hashCode) +
    (enabled == null ? 0 : enabled!.hashCode) +
    (method.hashCode);

  @override
  String toString() => 'WorkflowShareStepDto[config=$config, enabled=$enabled, method=$method]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.config != null) {
      json[r'config'] = this.config;
    } else {
    //  json[r'config'] = null;
    }
    if (this.enabled != null) {
      json[r'enabled'] = this.enabled;
    } else {
    //  json[r'enabled'] = null;
    }
      json[r'method'] = this.method;
    return json;
  }

  /// Returns a new [WorkflowShareStepDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowShareStepDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowShareStepDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowShareStepDto(
        config: mapCastOfType<String, Object>(json, r'config'),
        enabled: mapValueOfType<bool>(json, r'enabled'),
        method: mapValueOfType<String>(json, r'method')!,
      );
    }
    return null;
  }

  static List<WorkflowShareStepDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowShareStepDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowShareStepDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowShareStepDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowShareStepDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowShareStepDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowShareStepDto-objects as value to a dart map
  static Map<String, List<WorkflowShareStepDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowShareStepDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowShareStepDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'config',
    'method',
  };
}

