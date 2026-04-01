//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DatabaseBackupDeleteDto {
  /// Returns a new [DatabaseBackupDeleteDto] instance.
  DatabaseBackupDeleteDto({
    this.backups = const [],
  });

  List<String> backups;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DatabaseBackupDeleteDto &&
    _deepEquality.equals(other.backups, backups);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backups.hashCode);

  @override
  String toString() => 'DatabaseBackupDeleteDto[backups=$backups]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backups'] = this.backups;
    return json;
  }

  /// Returns a new [DatabaseBackupDeleteDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DatabaseBackupDeleteDto? fromJson(dynamic value) {
    upgradeDto(value, "DatabaseBackupDeleteDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DatabaseBackupDeleteDto(
        backups: json[r'backups'] is Iterable
            ? (json[r'backups'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<DatabaseBackupDeleteDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DatabaseBackupDeleteDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DatabaseBackupDeleteDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DatabaseBackupDeleteDto> mapFromJson(dynamic json) {
    final map = <String, DatabaseBackupDeleteDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DatabaseBackupDeleteDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DatabaseBackupDeleteDto-objects as value to a dart map
  static Map<String, List<DatabaseBackupDeleteDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DatabaseBackupDeleteDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DatabaseBackupDeleteDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backups',
  };
}

