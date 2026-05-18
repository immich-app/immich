//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowCreateDto {
  /// Returns a new [WorkflowCreateDto] instance.
  WorkflowCreateDto({
    this.description,
    this.enabled,
    this.name,
    this.steps = const [],
    required this.trigger,
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

  WorkflowTrigger trigger;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowCreateDto &&
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
    (trigger.hashCode);

  @override
  String toString() => 'WorkflowCreateDto[description=$description, enabled=$enabled, name=$name, steps=$steps, trigger=$trigger]';

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
      json[r'trigger'] = this.trigger;
    return json;
  }

  /// Returns a new [WorkflowCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowCreateDto(
        description: mapValueOfType<String>(json, r'description'),
        enabled: mapValueOfType<bool>(json, r'enabled'),
        name: mapValueOfType<String>(json, r'name'),
        steps: WorkflowStepDto.listFromJson(json[r'steps']),
        trigger: WorkflowTrigger.fromJson(json[r'trigger'])!,
      );
    }
    return null;
  }

  static List<WorkflowCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowCreateDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowCreateDto-objects as value to a dart map
  static Map<String, List<WorkflowCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'trigger',
  };
}

