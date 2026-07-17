//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowTriggerResponseDto {
  /// Returns a new [WorkflowTriggerResponseDto] instance.
  WorkflowTriggerResponseDto({
    required this.trigger,
    this.types = const [],
  });

  WorkflowTrigger trigger;

  /// Workflow types
  List<WorkflowType> types;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowTriggerResponseDto &&
    other.trigger == trigger &&
    _deepEquality.equals(other.types, types);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (trigger.hashCode) +
    (types.hashCode);

  @override
  String toString() => 'WorkflowTriggerResponseDto[trigger=$trigger, types=$types]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'trigger'] = this.trigger;
      json[r'types'] = this.types;
    return json;
  }

  /// Returns a new [WorkflowTriggerResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowTriggerResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowTriggerResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowTriggerResponseDto(
        trigger: WorkflowTrigger.fromJson(json[r'trigger'])!,
        types: WorkflowType.listFromJson(json[r'types']),
      );
    }
    return null;
  }

  static List<WorkflowTriggerResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowTriggerResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowTriggerResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowTriggerResponseDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowTriggerResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowTriggerResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowTriggerResponseDto-objects as value to a dart map
  static Map<String, List<WorkflowTriggerResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowTriggerResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowTriggerResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'trigger',
    'types',
  };
}

