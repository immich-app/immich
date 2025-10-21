//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UploadBackupConfig {
  /// Returns a new [UploadBackupConfig] instance.
  UploadBackupConfig({
    required this.maxAgeHours,
  });

  /// Minimum value: 1
  num maxAgeHours;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UploadBackupConfig &&
    other.maxAgeHours == maxAgeHours;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (maxAgeHours.hashCode);

  @override
  String toString() => 'UploadBackupConfig[maxAgeHours=$maxAgeHours]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'maxAgeHours'] = this.maxAgeHours;
    return json;
  }

  /// Returns a new [UploadBackupConfig] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UploadBackupConfig? fromJson(dynamic value) {
    upgradeDto(value, "UploadBackupConfig");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UploadBackupConfig(
        maxAgeHours: num.parse('${json[r'maxAgeHours']}'),
      );
    }
    return null;
  }

  static List<UploadBackupConfig> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UploadBackupConfig>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UploadBackupConfig.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UploadBackupConfig> mapFromJson(dynamic json) {
    final map = <String, UploadBackupConfig>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UploadBackupConfig.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UploadBackupConfig-objects as value to a dart map
  static Map<String, List<UploadBackupConfig>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UploadBackupConfig>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UploadBackupConfig.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'maxAgeHours',
  };
}

