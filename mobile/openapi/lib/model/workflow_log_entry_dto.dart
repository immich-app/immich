//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class WorkflowLogEntryDto {
  /// Returns a new [WorkflowLogEntryDto] instance.
  WorkflowLogEntryDto({
    required this.at,
    this.lastStep = const Optional.absent(),
    required this.result,
    this.triggerDataId = const Optional.absent(),
  });

  /// Workflow run date/time
  String at;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<WorkflowLogEntryDtoLastStep?> lastStep;

  WorkflowResult result;

  /// Workflow trigger data ID
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> triggerDataId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowLogEntryDto &&
    other.at == at &&
    other.lastStep == lastStep &&
    other.result == result &&
    other.triggerDataId == triggerDataId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (at.hashCode) +
    (lastStep == null ? 0 : lastStep!.hashCode) +
    (result.hashCode) +
    (triggerDataId == null ? 0 : triggerDataId!.hashCode);

  @override
  String toString() => 'WorkflowLogEntryDto[at=$at, lastStep=$lastStep, result=$result, triggerDataId=$triggerDataId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'at'] = this.at;
    if (this.lastStep.isPresent) {
      final value = this.lastStep.value;
      json[r'lastStep'] = value;
    }
      json[r'result'] = this.result;
    if (this.triggerDataId.isPresent) {
      final value = this.triggerDataId.value;
      json[r'triggerDataId'] = value;
    }
    return json;
  }

  /// Returns a new [WorkflowLogEntryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static WorkflowLogEntryDto? fromJson(dynamic value) {
    upgradeDto(value, "WorkflowLogEntryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return WorkflowLogEntryDto(
        at: mapValueOfType<String>(json, r'at')!,
        lastStep: json.containsKey(r'lastStep') ? Optional.present(WorkflowLogEntryDtoLastStep.fromJson(json[r'lastStep'])) : const Optional.absent(),
        result: WorkflowResult.fromJson(json[r'result'])!,
        triggerDataId: json.containsKey(r'triggerDataId') ? Optional.present(mapValueOfType<String>(json, r'triggerDataId')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<WorkflowLogEntryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <WorkflowLogEntryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = WorkflowLogEntryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, WorkflowLogEntryDto> mapFromJson(dynamic json) {
    final map = <String, WorkflowLogEntryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = WorkflowLogEntryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of WorkflowLogEntryDto-objects as value to a dart map
  static Map<String, List<WorkflowLogEntryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<WorkflowLogEntryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = WorkflowLogEntryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'at',
    'result',
  };
}

