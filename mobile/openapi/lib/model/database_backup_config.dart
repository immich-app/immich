//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DatabaseBackupConfig {
  /// Returns a new [DatabaseBackupConfig] instance.
  DatabaseBackupConfig({
    required this.cronExpression,
    required this.enabled,
    required this.keepLastAmount,
  });

  String cronExpression;

  bool enabled;

  /// Minimum value: 1
  num keepLastAmount;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DatabaseBackupConfig &&
    other.cronExpression == cronExpression &&
    other.enabled == enabled &&
    other.keepLastAmount == keepLastAmount;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (cronExpression.hashCode) +
    (enabled.hashCode) +
    (keepLastAmount.hashCode);

  @override
  String toString() => 'DatabaseBackupConfig[cronExpression=$cronExpression, enabled=$enabled, keepLastAmount=$keepLastAmount]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'cronExpression'] = this.cronExpression;
      json[r'enabled'] = this.enabled;
      json[r'keepLastAmount'] = this.keepLastAmount;
    return json;
  }

  /// Returns a new [DatabaseBackupConfig] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DatabaseBackupConfig? fromJson(dynamic value) {
    upgradeDto(value, "DatabaseBackupConfig");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DatabaseBackupConfig(
        cronExpression: mapValueOfType<String>(json, r'cronExpression')!,
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        keepLastAmount: num.parse('${json[r'keepLastAmount']}'),
      );
    }
    return null;
  }

  static List<DatabaseBackupConfig> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DatabaseBackupConfig>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DatabaseBackupConfig.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DatabaseBackupConfig> mapFromJson(dynamic json) {
    final map = <String, DatabaseBackupConfig>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DatabaseBackupConfig.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DatabaseBackupConfig-objects as value to a dart map
  static Map<String, List<DatabaseBackupConfig>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DatabaseBackupConfig>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DatabaseBackupConfig.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'cronExpression',
    'enabled',
    'keepLastAmount',
  };
}

