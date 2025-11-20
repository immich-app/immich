//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceListBackupsResponseDto {
  /// Returns a new [MaintenanceListBackupsResponseDto] instance.
  MaintenanceListBackupsResponseDto({
    this.backups = const [],
    this.failedBackups = const [],
  });

  List<String> backups;

  List<String> failedBackups;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceListBackupsResponseDto &&
    _deepEquality.equals(other.backups, backups) &&
    _deepEquality.equals(other.failedBackups, failedBackups);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backups.hashCode) +
    (failedBackups.hashCode);

  @override
  String toString() => 'MaintenanceListBackupsResponseDto[backups=$backups, failedBackups=$failedBackups]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backups'] = this.backups;
      json[r'failedBackups'] = this.failedBackups;
    return json;
  }

  /// Returns a new [MaintenanceListBackupsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceListBackupsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceListBackupsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceListBackupsResponseDto(
        backups: json[r'backups'] is Iterable
            ? (json[r'backups'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        failedBackups: json[r'failedBackups'] is Iterable
            ? (json[r'failedBackups'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<MaintenanceListBackupsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceListBackupsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceListBackupsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceListBackupsResponseDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceListBackupsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceListBackupsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceListBackupsResponseDto-objects as value to a dart map
  static Map<String, List<MaintenanceListBackupsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceListBackupsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceListBackupsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backups',
    'failedBackups',
  };
}

