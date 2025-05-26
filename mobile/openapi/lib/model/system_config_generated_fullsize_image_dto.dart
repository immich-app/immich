//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigGeneratedFullsizeImageDto {
  /// Returns a new [SystemConfigGeneratedFullsizeImageDto] instance.
  SystemConfigGeneratedFullsizeImageDto({
    required this.enabled,
    required this.format,
    required this.quality,
  });

  bool enabled;

  ImageFormat format;

  /// Minimum value: 1
  /// Maximum value: 100
  int quality;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigGeneratedFullsizeImageDto &&
    other.enabled == enabled &&
    other.format == format &&
    other.quality == quality;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (format.hashCode) +
    (quality.hashCode);

  @override
  String toString() => 'SystemConfigGeneratedFullsizeImageDto[enabled=$enabled, format=$format, quality=$quality]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'format'] = this.format;
      json[r'quality'] = this.quality;
    return json;
  }

  /// Returns a new [SystemConfigGeneratedFullsizeImageDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigGeneratedFullsizeImageDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigGeneratedFullsizeImageDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigGeneratedFullsizeImageDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        format: ImageFormat.fromJson(json[r'format'])!,
        quality: mapValueOfType<int>(json, r'quality')!,
      );
    }
    return null;
  }

  static List<SystemConfigGeneratedFullsizeImageDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigGeneratedFullsizeImageDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigGeneratedFullsizeImageDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigGeneratedFullsizeImageDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigGeneratedFullsizeImageDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigGeneratedFullsizeImageDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigGeneratedFullsizeImageDto-objects as value to a dart map
  static Map<String, List<SystemConfigGeneratedFullsizeImageDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigGeneratedFullsizeImageDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigGeneratedFullsizeImageDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'format',
    'quality',
  };
}

