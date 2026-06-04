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
    this.description = const Optional.absent(),
    this.enabled = const Optional.absent(),
    this.name = const Optional.absent(),
    this.steps = const Optional.present(const []),
    this.trigger = const Optional.absent(),
  });

  /// Workflow description
  Optional<String?> description;

  /// Workflow enabled
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> enabled;

  /// Workflow name
  Optional<String?> name;

  Optional<List<WorkflowStepDto>?> steps;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<WorkflowTrigger?> trigger;

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
    if (this.description.isPresent) {
      final value = this.description.value;
      json[r'description'] = value;
    }
    if (this.enabled.isPresent) {
      final value = this.enabled.value;
      json[r'enabled'] = value;
    }
    if (this.name.isPresent) {
      final value = this.name.value;
      json[r'name'] = value;
    }
    if (this.steps.isPresent) {
      final value = this.steps.value;
      json[r'steps'] = value;
    }
    if (this.trigger.isPresent) {
      final value = this.trigger.value;
      json[r'trigger'] = value;
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
        description: json.containsKey(r'description') ? Optional.present(mapValueOfType<String>(json, r'description')) : const Optional.absent(),
        enabled: json.containsKey(r'enabled') ? Optional.present(mapValueOfType<bool>(json, r'enabled')) : const Optional.absent(),
        name: json.containsKey(r'name') ? Optional.present(mapValueOfType<String>(json, r'name')) : const Optional.absent(),
        steps: json.containsKey(r'steps') ? Optional.present(WorkflowStepDto.listFromJson(json[r'steps'])) : const Optional.absent(),
        trigger: json.containsKey(r'trigger') ? Optional.present(WorkflowTrigger.fromJson(json[r'trigger'])) : const Optional.absent(),
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

