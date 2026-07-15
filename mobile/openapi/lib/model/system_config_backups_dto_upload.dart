//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigBackupsDtoUpload {
  /// Returns a new [SystemConfigBackupsDtoUpload] instance.
  SystemConfigBackupsDtoUpload({
    required this.maxAgeHours,
  });

  /// Minimum value: 1
  /// Maximum value: 9007199254740991
  int maxAgeHours;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigBackupsDtoUpload &&
    other.maxAgeHours == maxAgeHours;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (maxAgeHours.hashCode);

  @override
  String toString() => 'SystemConfigBackupsDtoUpload[maxAgeHours=$maxAgeHours]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'maxAgeHours'] = this.maxAgeHours;
    return json;
  }

  /// Returns a new [SystemConfigBackupsDtoUpload] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigBackupsDtoUpload? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigBackupsDtoUpload");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigBackupsDtoUpload(
        maxAgeHours: mapValueOfType<int>(json, r'maxAgeHours')!,
      );
    }
    return null;
  }

  static List<SystemConfigBackupsDtoUpload> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigBackupsDtoUpload>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigBackupsDtoUpload.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigBackupsDtoUpload> mapFromJson(dynamic json) {
    final map = <String, SystemConfigBackupsDtoUpload>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigBackupsDtoUpload.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigBackupsDtoUpload-objects as value to a dart map
  static Map<String, List<SystemConfigBackupsDtoUpload>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigBackupsDtoUpload>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigBackupsDtoUpload.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'maxAgeHours',
  };
}

