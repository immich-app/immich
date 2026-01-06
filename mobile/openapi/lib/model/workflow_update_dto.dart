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
    this.actions = const [],
    this.description,
    this.enabled,
    this.filters = const [],
    this.name,
    this.triggerType,
  });

  List<WorkflowActionItemDto> actions;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? enabled;

  List<WorkflowFilterItemDto> filters;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  PluginTriggerType? triggerType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowUpdateDto &&
    _deepEquality.equals(other.actions, actions) &&
    other.description == description &&
    other.enabled == enabled &&
    _deepEquality.equals(other.filters, filters) &&
    other.name == name &&
    other.triggerType == triggerType;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (actions.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (enabled == null ? 0 : enabled!.hashCode) +
    (filters.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (triggerType == null ? 0 : triggerType!.hashCode);

  @override
  String toString() => 'WorkflowUpdateDto[actions=$actions, description=$description, enabled=$enabled, filters=$filters, name=$name, triggerType=$triggerType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'actions'] = this.actions;
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
      json[r'filters'] = this.filters;
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.triggerType != null) {
      json[r'triggerType'] = this.triggerType;
    } else {
    //  json[r'triggerType'] = null;
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
        actions: WorkflowActionItemDto.listFromJson(json[r'actions']),
        description: mapValueOfType<String>(json, r'description'),
        enabled: mapValueOfType<bool>(json, r'enabled'),
        filters: WorkflowFilterItemDto.listFromJson(json[r'filters']),
        name: mapValueOfType<String>(json, r'name'),
        triggerType: PluginTriggerType.fromJson(json[r'triggerType']),
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

