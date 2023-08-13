//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigThumbnailDto {
  /// Returns a new [SystemConfigThumbnailDto] instance.
  SystemConfigThumbnailDto({
    required this.jpegSize,
    required this.webpSize,
  });

  int jpegSize;

  int webpSize;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigThumbnailDto &&
     other.jpegSize == jpegSize &&
     other.webpSize == webpSize;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (jpegSize.hashCode) +
    (webpSize.hashCode);

  @override
  String toString() => 'SystemConfigThumbnailDto[jpegSize=$jpegSize, webpSize=$webpSize]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'jpegSize'] = this.jpegSize;
      json[r'webpSize'] = this.webpSize;
    return json;
  }

  /// Returns a new [SystemConfigThumbnailDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigThumbnailDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigThumbnailDto(
        jpegSize: mapValueOfType<int>(json, r'jpegSize')!,
        webpSize: mapValueOfType<int>(json, r'webpSize')!,
      );
    }
    return null;
  }

  static List<SystemConfigThumbnailDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigThumbnailDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigThumbnailDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigThumbnailDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigThumbnailDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigThumbnailDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigThumbnailDto-objects as value to a dart map
  static Map<String, List<SystemConfigThumbnailDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigThumbnailDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigThumbnailDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'jpegSize',
    'webpSize',
  };
}

