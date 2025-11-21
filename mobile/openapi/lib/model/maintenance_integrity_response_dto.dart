//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceIntegrityResponseDto {
  /// Returns a new [MaintenanceIntegrityResponseDto] instance.
  MaintenanceIntegrityResponseDto({
    required this.storageHeuristics,
    required this.storageIntegrity,
  });

  Object storageHeuristics;

  Object storageIntegrity;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceIntegrityResponseDto &&
    other.storageHeuristics == storageHeuristics &&
    other.storageIntegrity == storageIntegrity;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (storageHeuristics.hashCode) +
    (storageIntegrity.hashCode);

  @override
  String toString() => 'MaintenanceIntegrityResponseDto[storageHeuristics=$storageHeuristics, storageIntegrity=$storageIntegrity]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'storageHeuristics'] = this.storageHeuristics;
      json[r'storageIntegrity'] = this.storageIntegrity;
    return json;
  }

  /// Returns a new [MaintenanceIntegrityResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceIntegrityResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceIntegrityResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceIntegrityResponseDto(
        storageHeuristics: mapValueOfType<Object>(json, r'storageHeuristics')!,
        storageIntegrity: mapValueOfType<Object>(json, r'storageIntegrity')!,
      );
    }
    return null;
  }

  static List<MaintenanceIntegrityResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceIntegrityResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceIntegrityResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceIntegrityResponseDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceIntegrityResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceIntegrityResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceIntegrityResponseDto-objects as value to a dart map
  static Map<String, List<MaintenanceIntegrityResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceIntegrityResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceIntegrityResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'storageHeuristics',
    'storageIntegrity',
  };
}

