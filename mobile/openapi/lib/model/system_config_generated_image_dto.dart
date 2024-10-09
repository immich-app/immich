//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigGeneratedImageDto {
  /// Returns a new [SystemConfigGeneratedImageDto] instance.
  SystemConfigGeneratedImageDto({
    required this.format,
    required this.quality,
    required this.size,
  });

  ImageFormat format;

  /// Minimum value: 1
  /// Maximum value: 100
  int quality;

  /// Minimum value: 1
  int size;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigGeneratedImageDto &&
    other.format == format &&
    other.quality == quality &&
    other.size == size;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (format.hashCode) +
    (quality.hashCode) +
    (size.hashCode);

  @override
  String toString() => 'SystemConfigGeneratedImageDto[format=$format, quality=$quality, size=$size]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'format'] = this.format;
      json[r'quality'] = this.quality;
      json[r'size'] = this.size;
    return json;
  }

  /// Returns a new [SystemConfigGeneratedImageDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigGeneratedImageDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigGeneratedImageDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigGeneratedImageDto(
        format: ImageFormat.fromJson(json[r'format'])!,
        quality: mapValueOfType<int>(json, r'quality')!,
        size: mapValueOfType<int>(json, r'size')!,
      );
    }
    return null;
  }

  static List<SystemConfigGeneratedImageDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigGeneratedImageDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigGeneratedImageDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigGeneratedImageDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigGeneratedImageDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigGeneratedImageDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigGeneratedImageDto-objects as value to a dart map
  static Map<String, List<SystemConfigGeneratedImageDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigGeneratedImageDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigGeneratedImageDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'format',
    'quality',
    'size',
  };
}

