//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RepositoryMetricsDto {
  /// Returns a new [RepositoryMetricsDto] instance.
  RepositoryMetricsDto({
    this.lastBackup,
    this.lastBackupDuration,
    this.lastSuccessfulBackup,
    required this.sizeBytes,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? lastBackup;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? lastBackupDuration;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? lastSuccessfulBackup;

  num sizeBytes;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RepositoryMetricsDto &&
    other.lastBackup == lastBackup &&
    other.lastBackupDuration == lastBackupDuration &&
    other.lastSuccessfulBackup == lastSuccessfulBackup &&
    other.sizeBytes == sizeBytes;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (lastBackup == null ? 0 : lastBackup!.hashCode) +
    (lastBackupDuration == null ? 0 : lastBackupDuration!.hashCode) +
    (lastSuccessfulBackup == null ? 0 : lastSuccessfulBackup!.hashCode) +
    (sizeBytes.hashCode);

  @override
  String toString() => 'RepositoryMetricsDto[lastBackup=$lastBackup, lastBackupDuration=$lastBackupDuration, lastSuccessfulBackup=$lastSuccessfulBackup, sizeBytes=$sizeBytes]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.lastBackup != null) {
      json[r'lastBackup'] = this.lastBackup;
    } else {
    //  json[r'lastBackup'] = null;
    }
    if (this.lastBackupDuration != null) {
      json[r'lastBackupDuration'] = this.lastBackupDuration;
    } else {
    //  json[r'lastBackupDuration'] = null;
    }
    if (this.lastSuccessfulBackup != null) {
      json[r'lastSuccessfulBackup'] = this.lastSuccessfulBackup;
    } else {
    //  json[r'lastSuccessfulBackup'] = null;
    }
      json[r'sizeBytes'] = this.sizeBytes;
    return json;
  }

  /// Returns a new [RepositoryMetricsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RepositoryMetricsDto? fromJson(dynamic value) {
    upgradeDto(value, "RepositoryMetricsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RepositoryMetricsDto(
        lastBackup: mapValueOfType<String>(json, r'lastBackup'),
        lastBackupDuration: num.parse('${json[r'lastBackupDuration']}'),
        lastSuccessfulBackup: mapValueOfType<String>(json, r'lastSuccessfulBackup'),
        sizeBytes: num.parse('${json[r'sizeBytes']}'),
      );
    }
    return null;
  }

  static List<RepositoryMetricsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RepositoryMetricsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RepositoryMetricsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RepositoryMetricsDto> mapFromJson(dynamic json) {
    final map = <String, RepositoryMetricsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RepositoryMetricsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RepositoryMetricsDto-objects as value to a dart map
  static Map<String, List<RepositoryMetricsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RepositoryMetricsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RepositoryMetricsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sizeBytes',
  };
}

