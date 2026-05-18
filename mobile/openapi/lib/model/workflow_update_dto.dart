//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowUpdateDto {
  /// Returns a new [WorkflowUpdateDto] instance.
  WorkflowUpdateDto({
    this.description,
    this.enabled,
    this.name,
    this.steps = const [],
    this.trigger,
  });

  /// Workflow description
  String? description;

  /// Workflow enabled
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? enabled;

  /// Workflow name
  String? name;

  List<WorkflowStepDto> steps;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  WorkflowTrigger? trigger;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowUpdateDto &&
    other.description == description &&
    other.enabled == enabled &&
    other.name == name &&
    _deepEquality.equals(other.steps, steps) &&
    other.trigger == trigger;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (description == null ? 0 : description!.hashCode) +
    (enabled == null ? 0 : enabled!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (steps.hashCode) +
    (trigger == null ? 0 : trigger!.hashCode);

  @override
  String toString() => 'WorkflowUpdateDto[description=$description, enabled=$enabled, name=$name, steps=$steps, trigger=$trigger]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.enabled != null) {
      json[r'enabled'] = this.enabled;
    } else {
    //  json[r'enabled'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
      json[r'steps'] = this.steps;
    if (this.trigger != null) {
      json[r'trigger'] = this.trigger;
    } else {
    //  json[r'trigger'] = null;
    }
    return json;
  }

  /// Returns a new [WorkflowUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowUpdateDto(
        description: mapValueOfType<String>(json, r'description'),
        enabled: mapValueOfType<bool>(json, r'enabled'),
        name: mapValueOfType<String>(json, r'name'),
        steps: WorkflowStepDto.listFromJson(json[r'steps']),
        trigger: WorkflowTrigger.fromJson(json[r'trigger']),
      );
    }
    return null;
  }

  static List<WorkflowUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowUpdateDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowUpdateDto-objects as value to a dart map
  static Map<String, List<WorkflowUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

