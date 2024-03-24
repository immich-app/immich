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
    required this.colorspace,
    required this.previewFormat,
    required this.previewSize,
    required this.quality,
    required this.thumbnailFormat,
    required this.thumbnailSize,
  });

  Colorspace colorspace;

  ImageFormat previewFormat;

  int previewSize;

  int quality;

  ImageFormat thumbnailFormat;

  int thumbnailSize;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigThumbnailDto &&
    other.colorspace == colorspace &&
    other.previewFormat == previewFormat &&
    other.previewSize == previewSize &&
    other.quality == quality &&
    other.thumbnailFormat == thumbnailFormat &&
    other.thumbnailSize == thumbnailSize;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (colorspace.hashCode) +
    (previewFormat.hashCode) +
    (previewSize.hashCode) +
    (quality.hashCode) +
    (thumbnailFormat.hashCode) +
    (thumbnailSize.hashCode);

  @override
  String toString() => 'SystemConfigThumbnailDto[colorspace=$colorspace, previewFormat=$previewFormat, previewSize=$previewSize, quality=$quality, thumbnailFormat=$thumbnailFormat, thumbnailSize=$thumbnailSize]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'colorspace'] = this.colorspace;
      json[r'previewFormat'] = this.previewFormat;
      json[r'previewSize'] = this.previewSize;
      json[r'quality'] = this.quality;
      json[r'thumbnailFormat'] = this.thumbnailFormat;
      json[r'thumbnailSize'] = this.thumbnailSize;
    return json;
  }

  /// Returns a new [SystemConfigThumbnailDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigThumbnailDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigThumbnailDto(
        colorspace: Colorspace.fromJson(json[r'colorspace'])!,
        previewFormat: ImageFormat.fromJson(json[r'previewFormat'])!,
        previewSize: mapValueOfType<int>(json, r'previewSize')!,
        quality: mapValueOfType<int>(json, r'quality')!,
        thumbnailFormat: ImageFormat.fromJson(json[r'thumbnailFormat'])!,
        thumbnailSize: mapValueOfType<int>(json, r'thumbnailSize')!,
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
    'colorspace',
    'previewFormat',
    'previewSize',
    'quality',
    'thumbnailFormat',
    'thumbnailSize',
  };
}

