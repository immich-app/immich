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
    this.actions = const [],
    this.description,
    required this.displayName,
    this.enabled,
    this.filters = const [],
    required this.name,
    this.triggerConfig,
    required this.triggerType,
  });

  List<WorkflowActionItemDto> actions;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  String displayName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? enabled;

  List<WorkflowFilterItemDto> filters;

  String name;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Object? triggerConfig;

  PluginTriggerType triggerType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is WorkflowCreateDto &&
    _deepEquality.equals(other.actions, actions) &&
    other.description == description &&
    other.displayName == displayName &&
    other.enabled == enabled &&
    _deepEquality.equals(other.filters, filters) &&
    other.name == name &&
    other.triggerConfig == triggerConfig &&
    other.triggerType == triggerType;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (actions.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (displayName.hashCode) +
    (enabled == null ? 0 : enabled!.hashCode) +
    (filters.hashCode) +
    (name.hashCode) +
    (triggerConfig == null ? 0 : triggerConfig!.hashCode) +
    (triggerType.hashCode);

  @override
  String toString() => 'WorkflowCreateDto[actions=$actions, description=$description, displayName=$displayName, enabled=$enabled, filters=$filters, name=$name, triggerConfig=$triggerConfig, triggerType=$triggerType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'actions'] = this.actions;
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'displayName'] = this.displayName;
    if (this.enabled != null) {
      json[r'enabled'] = this.enabled;
    } else {
    //  json[r'enabled'] = null;
    }
      json[r'filters'] = this.filters;
      json[r'name'] = this.name;
    if (this.triggerConfig != null) {
      json[r'triggerConfig'] = this.triggerConfig;
    } else {
    //  json[r'triggerConfig'] = null;
    }
      json[r'triggerType'] = this.triggerType;
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
        actions: WorkflowActionItemDto.listFromJson(json[r'actions']),
        description: mapValueOfType<String>(json, r'description'),
        displayName: mapValueOfType<String>(json, r'displayName')!,
        enabled: mapValueOfType<bool>(json, r'enabled'),
        filters: WorkflowFilterItemDto.listFromJson(json[r'filters']),
        name: mapValueOfType<String>(json, r'name')!,
        triggerConfig: mapValueOfType<Object>(json, r'triggerConfig'),
        triggerType: PluginTriggerType.fromJson(json[r'triggerType'])!,
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
    'actions',
    'displayName',
    'filters',
    'name',
    'triggerType',
  };
}

