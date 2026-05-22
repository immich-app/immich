//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DatabaseBackupListResponseDto {
  /// Returns a new [DatabaseBackupListResponseDto] instance.
  DatabaseBackupListResponseDto({
    this.backups = const [],
  });

  List<DatabaseBackupDto> backups;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DatabaseBackupListResponseDto &&
    _deepEquality.equals(other.backups, backups);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backups.hashCode);

  @override
  String toString() => 'DatabaseBackupListResponseDto[backups=$backups]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backups'] = this.backups;
    return json;
  }

  /// Returns a new [DatabaseBackupListResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DatabaseBackupListResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "DatabaseBackupListResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DatabaseBackupListResponseDto(
        backups: DatabaseBackupDto.listFromJson(json[r'backups']),
      );
    }
    return null;
  }

  static List<DatabaseBackupListResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DatabaseBackupListResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DatabaseBackupListResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DatabaseBackupListResponseDto> mapFromJson(dynamic json) {
    final map = <String, DatabaseBackupListResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DatabaseBackupListResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DatabaseBackupListResponseDto-objects as value to a dart map
  static Map<String, List<DatabaseBackupListResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DatabaseBackupListResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DatabaseBackupListResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backups',
  };
}

