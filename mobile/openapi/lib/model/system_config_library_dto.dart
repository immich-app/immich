//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigLibraryDto {
  /// Returns a new [SystemConfigLibraryDto] instance.
  SystemConfigLibraryDto({
    required this.scan,
    required this.watch,
  });

  SystemConfigLibraryScanDto scan;

  SystemConfigLibraryWatchDto watch;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigLibraryDto &&
    other.scan == scan &&
    other.watch == watch;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (scan.hashCode) +
    (watch.hashCode);

  @override
  String toString() => 'SystemConfigLibraryDto[scan=$scan, watch=$watch]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'scan'] = this.scan;
      json[r'watch'] = this.watch;
    return json;
  }

  /// Returns a new [SystemConfigLibraryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigLibraryDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigLibraryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigLibraryDto(
        scan: SystemConfigLibraryScanDto.fromJson(json[r'scan'])!,
        watch: SystemConfigLibraryWatchDto.fromJson(json[r'watch'])!,
      );
    }
    return null;
  }

  static List<SystemConfigLibraryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigLibraryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigLibraryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigLibraryDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigLibraryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigLibraryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigLibraryDto-objects as value to a dart map
  static Map<String, List<SystemConfigLibraryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigLibraryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigLibraryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'scan',
    'watch',
  };
}

