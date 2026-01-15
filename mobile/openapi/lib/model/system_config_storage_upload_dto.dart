//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigStorageUploadDto {
  /// Returns a new [SystemConfigStorageUploadDto] instance.
  SystemConfigStorageUploadDto({
    required this.deleteLocalAfterUpload,
    required this.strategy,
  });

  bool deleteLocalAfterUpload;

  UploadStrategy strategy;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigStorageUploadDto &&
    other.deleteLocalAfterUpload == deleteLocalAfterUpload &&
    other.strategy == strategy;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deleteLocalAfterUpload.hashCode) +
    (strategy.hashCode);

  @override
  String toString() => 'SystemConfigStorageUploadDto[deleteLocalAfterUpload=$deleteLocalAfterUpload, strategy=$strategy]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'deleteLocalAfterUpload'] = this.deleteLocalAfterUpload;
      json[r'strategy'] = this.strategy;
    return json;
  }

  /// Returns a new [SystemConfigStorageUploadDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigStorageUploadDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigStorageUploadDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigStorageUploadDto(
        deleteLocalAfterUpload: mapValueOfType<bool>(json, r'deleteLocalAfterUpload')!,
        strategy: UploadStrategy.fromJson(json[r'strategy'])!,
      );
    }
    return null;
  }

  static List<SystemConfigStorageUploadDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageUploadDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageUploadDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigStorageUploadDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigStorageUploadDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigStorageUploadDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigStorageUploadDto-objects as value to a dart map
  static Map<String, List<SystemConfigStorageUploadDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigStorageUploadDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigStorageUploadDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deleteLocalAfterUpload',
    'strategy',
  };
}

