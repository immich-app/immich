//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigIntegrityChecks {
  /// Returns a new [SystemConfigIntegrityChecks] instance.
  SystemConfigIntegrityChecks({
    required this.checksumFiles,
    required this.missingFiles,
    required this.orphanedFiles,
  });

  SystemConfigIntegrityChecksumJob checksumFiles;

  SystemConfigIntegrityJob missingFiles;

  SystemConfigIntegrityJob orphanedFiles;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigIntegrityChecks &&
    other.checksumFiles == checksumFiles &&
    other.missingFiles == missingFiles &&
    other.orphanedFiles == orphanedFiles;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksumFiles.hashCode) +
    (missingFiles.hashCode) +
    (orphanedFiles.hashCode);

  @override
  String toString() => 'SystemConfigIntegrityChecks[checksumFiles=$checksumFiles, missingFiles=$missingFiles, orphanedFiles=$orphanedFiles]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksumFiles'] = this.checksumFiles;
      json[r'missingFiles'] = this.missingFiles;
      json[r'orphanedFiles'] = this.orphanedFiles;
    return json;
  }

  /// Returns a new [SystemConfigIntegrityChecks] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigIntegrityChecks? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigIntegrityChecks");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigIntegrityChecks(
        checksumFiles: SystemConfigIntegrityChecksumJob.fromJson(json[r'checksumFiles'])!,
        missingFiles: SystemConfigIntegrityJob.fromJson(json[r'missingFiles'])!,
        orphanedFiles: SystemConfigIntegrityJob.fromJson(json[r'orphanedFiles'])!,
      );
    }
    return null;
  }

  static List<SystemConfigIntegrityChecks> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigIntegrityChecks>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigIntegrityChecks.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigIntegrityChecks> mapFromJson(dynamic json) {
    final map = <String, SystemConfigIntegrityChecks>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigIntegrityChecks.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigIntegrityChecks-objects as value to a dart map
  static Map<String, List<SystemConfigIntegrityChecks>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigIntegrityChecks>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigIntegrityChecks.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksumFiles',
    'missingFiles',
    'orphanedFiles',
  };
}

