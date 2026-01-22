//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DatabaseBackupDto {
  /// Returns a new [DatabaseBackupDto] instance.
  DatabaseBackupDto({
    required this.filename,
    required this.filesize,
  });

  String filename;

  num filesize;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DatabaseBackupDto &&
    other.filename == filename &&
    other.filesize == filesize;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (filename.hashCode) +
    (filesize.hashCode);

  @override
  String toString() => 'DatabaseBackupDto[filename=$filename, filesize=$filesize]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'filename'] = this.filename;
      json[r'filesize'] = this.filesize;
    return json;
  }

  /// Returns a new [DatabaseBackupDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DatabaseBackupDto? fromJson(dynamic value) {
    upgradeDto(value, "DatabaseBackupDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DatabaseBackupDto(
        filename: mapValueOfType<String>(json, r'filename')!,
        filesize: num.parse('${json[r'filesize']}'),
      );
    }
    return null;
  }

  static List<DatabaseBackupDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DatabaseBackupDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DatabaseBackupDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DatabaseBackupDto> mapFromJson(dynamic json) {
    final map = <String, DatabaseBackupDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DatabaseBackupDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DatabaseBackupDto-objects as value to a dart map
  static Map<String, List<DatabaseBackupDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DatabaseBackupDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DatabaseBackupDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'filename',
    'filesize',
  };
}

