//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowLogEntryDtoLastStep {
  /// Returns a new [WorkflowLogEntryDtoLastStep] instance.
  WorkflowLogEntryDtoLastStep({
    required this.index,
    required this.method,
  });

  /// Index of the step in the workflow
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int index;

  /// Method of the step
  String method;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowLogEntryDtoLastStep &&
    other.index == index &&
    other.method == method;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (index.hashCode) +
    (method.hashCode);

  @override
  String toString() => 'WorkflowLogEntryDtoLastStep[index=$index, method=$method]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'index'] = this.index;
      json[r'method'] = this.method;
    return json;
  }

  /// Returns a new [WorkflowLogEntryDtoLastStep] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowLogEntryDtoLastStep? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowLogEntryDtoLastStep");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowLogEntryDtoLastStep(
        index: mapValueOfType<int>(json, r'index')!,
        method: mapValueOfType<String>(json, r'method')!,
      );
    }
    return null;
  }

  static List<WorkflowLogEntryDtoLastStep> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowLogEntryDtoLastStep>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowLogEntryDtoLastStep.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowLogEntryDtoLastStep> mapFromJson(dynamic json) {
    final map = <String, WorkflowLogEntryDtoLastStep>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowLogEntryDtoLastStep.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowLogEntryDtoLastStep-objects as value to a dart map
  static Map<String, List<WorkflowLogEntryDtoLastStep>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowLogEntryDtoLastStep>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowLogEntryDtoLastStep.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'index',
    'method',
  };
}

