//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowResponseDto {
  /// Returns a new [WorkflowResponseDto] instance.
  WorkflowResponseDto({
    required this.createdAt,
    required this.description,
    required this.enabled,
    required this.id,
    required this.name,
    this.steps = const [],
    required this.trigger,
    required this.updatedAt,
  });

  /// Creation date
  String createdAt;

  /// Workflow description
  String? description;

  /// Workflow enabled
  bool enabled;

  /// Workflow ID
  String id;

  /// Workflow name
  String? name;

  /// Workflow steps
  List<WorkflowStepDto> steps;

  WorkflowTrigger trigger;

  /// Update date
  String updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowResponseDto &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.enabled == enabled &&
    other.id == id &&
    other.name == name &&
    _deepEquality.equals(other.steps, steps) &&
    other.trigger == trigger &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (enabled.hashCode) +
    (id.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (steps.hashCode) +
    (trigger.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'WorkflowResponseDto[createdAt=$createdAt, description=$description, enabled=$enabled, id=$id, name=$name, steps=$steps, trigger=$trigger, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt;
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
      json[r'description'] = null;
    }
      json[r'enabled'] = this.enabled;
      json[r'id'] = this.id;
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
      json[r'name'] = null;
    }
      json[r'steps'] = this.steps;
      json[r'trigger'] = this.trigger;
      json[r'updatedAt'] = this.updatedAt;
    return json;
  }

  /// Returns a new [WorkflowResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowResponseDto(
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        description: mapValueOfType<String>(json, r'description'),
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name'),
        steps: WorkflowStepDto.listFromJson(json[r'steps']),
        trigger: WorkflowTrigger.fromJson(json[r'trigger'])!,
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
      );
    }
    return null;
  }

  static List<WorkflowResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowResponseDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowResponseDto-objects as value to a dart map
  static Map<String, List<WorkflowResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'description',
    'enabled',
    'id',
    'name',
    'steps',
    'trigger',
    'updatedAt',
  };
}

