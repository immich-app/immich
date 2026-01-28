//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceStatusResponseDto {
  /// Returns a new [MaintenanceStatusResponseDto] instance.
  MaintenanceStatusResponseDto({
    required this.action,
    required this.active,
    this.error,
    this.progress,
    this.task,
  });

  /// Maintenance action
  MaintenanceAction action;

  bool active;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? error;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? progress;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? task;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceStatusResponseDto &&
    other.action == action &&
    other.active == active &&
    other.error == error &&
    other.progress == progress &&
    other.task == task;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (action.hashCode) +
    (active.hashCode) +
    (error == null ? 0 : error!.hashCode) +
    (progress == null ? 0 : progress!.hashCode) +
    (task == null ? 0 : task!.hashCode);

  @override
  String toString() => 'MaintenanceStatusResponseDto[action=$action, active=$active, error=$error, progress=$progress, task=$task]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'action'] = this.action;
      json[r'active'] = this.active;
    if (this.error != null) {
      json[r'error'] = this.error;
    } else {
    //  json[r'error'] = null;
    }
    if (this.progress != null) {
      json[r'progress'] = this.progress;
    } else {
    //  json[r'progress'] = null;
    }
    if (this.task != null) {
      json[r'task'] = this.task;
    } else {
    //  json[r'task'] = null;
    }
    return json;
  }

  /// Returns a new [MaintenanceStatusResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceStatusResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceStatusResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceStatusResponseDto(
        action: MaintenanceAction.fromJson(json[r'action'])!,
        active: mapValueOfType<bool>(json, r'active')!,
        error: mapValueOfType<String>(json, r'error'),
        progress: num.parse('${json[r'progress']}'),
        task: mapValueOfType<String>(json, r'task'),
      );
    }
    return null;
  }

  static List<MaintenanceStatusResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceStatusResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceStatusResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceStatusResponseDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceStatusResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceStatusResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceStatusResponseDto-objects as value to a dart map
  static Map<String, List<MaintenanceStatusResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceStatusResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceStatusResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'action',
    'active',
  };
}

