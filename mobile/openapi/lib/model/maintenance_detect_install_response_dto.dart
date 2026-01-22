//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MaintenanceDetectInstallResponseDto {
  /// Returns a new [MaintenanceDetectInstallResponseDto] instance.
  MaintenanceDetectInstallResponseDto({
    this.storage = const [],
  });

  List<MaintenanceDetectInstallStorageFolderDto> storage;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MaintenanceDetectInstallResponseDto &&
    _deepEquality.equals(other.storage, storage);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (storage.hashCode);

  @override
  String toString() => 'MaintenanceDetectInstallResponseDto[storage=$storage]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'storage'] = this.storage;
    return json;
  }

  /// Returns a new [MaintenanceDetectInstallResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MaintenanceDetectInstallResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MaintenanceDetectInstallResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MaintenanceDetectInstallResponseDto(
        storage: MaintenanceDetectInstallStorageFolderDto.listFromJson(json[r'storage']),
      );
    }
    return null;
  }

  static List<MaintenanceDetectInstallResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MaintenanceDetectInstallResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MaintenanceDetectInstallResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MaintenanceDetectInstallResponseDto> mapFromJson(dynamic json) {
    final map = <String, MaintenanceDetectInstallResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MaintenanceDetectInstallResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MaintenanceDetectInstallResponseDto-objects as value to a dart map
  static Map<String, List<MaintenanceDetectInstallResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MaintenanceDetectInstallResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MaintenanceDetectInstallResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'storage',
  };
}

