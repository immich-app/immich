//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigStorageDto {
  /// Returns a new [SystemConfigStorageDto] instance.
  SystemConfigStorageDto({
    required this.backend,
    required this.locations,
    required this.s3,
    required this.upload,
  });

  StorageBackend backend;

  SystemConfigStorageLocationsDto locations;

  SystemConfigStorageS3Dto s3;

  SystemConfigStorageUploadDto upload;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigStorageDto &&
    other.backend == backend &&
    other.locations == locations &&
    other.s3 == s3 &&
    other.upload == upload;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backend.hashCode) +
    (locations.hashCode) +
    (s3.hashCode) +
    (upload.hashCode);

  @override
  String toString() => 'SystemConfigStorageDto[backend=$backend, locations=$locations, s3=$s3, upload=$upload]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backend'] = this.backend;
      json[r'locations'] = this.locations;
      json[r's3'] = this.s3;
      json[r'upload'] = this.upload;
    return json;
  }

  /// Returns a new [SystemConfigStorageDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigStorageDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigStorageDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigStorageDto(
        backend: StorageBackend.fromJson(json[r'backend'])!,
        locations: SystemConfigStorageLocationsDto.fromJson(json[r'locations'])!,
        s3: SystemConfigStorageS3Dto.fromJson(json[r's3'])!,
        upload: SystemConfigStorageUploadDto.fromJson(json[r'upload'])!,
      );
    }
    return null;
  }

  static List<SystemConfigStorageDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigStorageDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigStorageDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigStorageDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigStorageDto-objects as value to a dart map
  static Map<String, List<SystemConfigStorageDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigStorageDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigStorageDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backend',
    'locations',
    's3',
    'upload',
  };
}

