//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceIntegrityReportDto {
  /// Returns a new [MaintenanceIntegrityReportDto] instance.
  MaintenanceIntegrityReportDto({
    required this.id,
    required this.path,
    required this.type,
  });

  String id;

  String path;

  IntegrityReportType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceIntegrityReportDto &&
    other.id == id &&
    other.path == path &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (path.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'MaintenanceIntegrityReportDto[id=$id, path=$path, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'path'] = this.path;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [MaintenanceIntegrityReportDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceIntegrityReportDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceIntegrityReportDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceIntegrityReportDto(
        id: mapValueOfType<String>(json, r'id')!,
        path: mapValueOfType<String>(json, r'path')!,
        type: IntegrityReportType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<MaintenanceIntegrityReportDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceIntegrityReportDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceIntegrityReportDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceIntegrityReportDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceIntegrityReportDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceIntegrityReportDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceIntegrityReportDto-objects as value to a dart map
  static Map<String, List<MaintenanceIntegrityReportDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceIntegrityReportDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceIntegrityReportDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'path',
    'type',
  };
}

