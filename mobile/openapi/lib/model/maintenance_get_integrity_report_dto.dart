//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceGetIntegrityReportDto {
  /// Returns a new [MaintenanceGetIntegrityReportDto] instance.
  MaintenanceGetIntegrityReportDto({
    required this.type,
  });

  IntegrityReportType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceGetIntegrityReportDto &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (type.hashCode);

  @override
  String toString() => 'MaintenanceGetIntegrityReportDto[type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [MaintenanceGetIntegrityReportDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceGetIntegrityReportDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceGetIntegrityReportDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceGetIntegrityReportDto(
        type: IntegrityReportType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<MaintenanceGetIntegrityReportDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceGetIntegrityReportDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceGetIntegrityReportDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceGetIntegrityReportDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceGetIntegrityReportDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceGetIntegrityReportDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceGetIntegrityReportDto-objects as value to a dart map
  static Map<String, List<MaintenanceGetIntegrityReportDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceGetIntegrityReportDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceGetIntegrityReportDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'type',
  };
}

