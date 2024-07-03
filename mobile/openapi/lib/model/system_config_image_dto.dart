//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigImageDto {
  /// Returns a new [SystemConfigImageDto] instance.
  SystemConfigImageDto({
    required this.colorspace,
    required this.extractEmbedded,
    required this.previewFormat,
    required this.previewSize,
    required this.quality,
    required this.thumbnailFormat,
    required this.thumbnailSize,
  });

  Colorspace colorspace;

  bool extractEmbedded;

  ImageFormat previewFormat;

  /// Minimum value: 1
  int previewSize;

  /// Minimum value: 1
  /// Maximum value: 100
  int quality;

  ImageFormat thumbnailFormat;

  /// Minimum value: 1
  int thumbnailSize;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigImageDto &&
    other.colorspace == colorspace &&
    other.extractEmbedded == extractEmbedded &&
    other.previewFormat == previewFormat &&
    other.previewSize == previewSize &&
    other.quality == quality &&
    other.thumbnailFormat == thumbnailFormat &&
    other.thumbnailSize == thumbnailSize;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (colorspace.hashCode) +
    (extractEmbedded.hashCode) +
    (previewFormat.hashCode) +
    (previewSize.hashCode) +
    (quality.hashCode) +
    (thumbnailFormat.hashCode) +
    (thumbnailSize.hashCode);

  @override
  String toString() => 'SystemConfigImageDto[colorspace=$colorspace, extractEmbedded=$extractEmbedded, previewFormat=$previewFormat, previewSize=$previewSize, quality=$quality, thumbnailFormat=$thumbnailFormat, thumbnailSize=$thumbnailSize]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'colorspace'] = this.colorspace;
      json[r'extractEmbedded'] = this.extractEmbedded;
      json[r'previewFormat'] = this.previewFormat;
      json[r'previewSize'] = this.previewSize;
      json[r'quality'] = this.quality;
      json[r'thumbnailFormat'] = this.thumbnailFormat;
      json[r'thumbnailSize'] = this.thumbnailSize;
    return json;
  }

  /// Returns a new [SystemConfigImageDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigImageDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigImageDto(
        colorspace: Colorspace.fromJson(json[r'colorspace'])!,
        extractEmbedded: mapValueOfType<bool>(json, r'extractEmbedded')!,
        previewFormat: ImageFormat.fromJson(json[r'previewFormat'])!,
        previewSize: mapValueOfType<int>(json, r'previewSize')!,
        quality: mapValueOfType<int>(json, r'quality')!,
        thumbnailFormat: ImageFormat.fromJson(json[r'thumbnailFormat'])!,
        thumbnailSize: mapValueOfType<int>(json, r'thumbnailSize')!,
      );
    }
    return null;
  }

  static List<SystemConfigImageDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigImageDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigImageDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigImageDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigImageDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigImageDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigImageDto-objects as value to a dart map
  static Map<String, List<SystemConfigImageDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigImageDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigImageDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'colorspace',
    'extractEmbedded',
    'previewFormat',
    'previewSize',
    'quality',
    'thumbnailFormat',
    'thumbnailSize',
  };
}

