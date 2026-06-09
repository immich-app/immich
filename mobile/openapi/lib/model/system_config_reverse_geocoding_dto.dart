//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigReverseGeocodingDto {
  /// Returns a new [SystemConfigReverseGeocodingDto] instance.
  SystemConfigReverseGeocodingDto({
    required this.enabled,
  });

  /// Enabled
  bool enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigReverseGeocodingDto &&
    other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode);

  @override
  String toString() => 'SystemConfigReverseGeocodingDto[enabled=$enabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
    return json;
  }

  /// Returns a new [SystemConfigReverseGeocodingDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigReverseGeocodingDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'enabled'), 'Required key "SystemConfigReverseGeocodingDto[enabled]" is missing from JSON.');
        assert(json[r'enabled'] != null, 'Required key "SystemConfigReverseGeocodingDto[enabled]" has a null value in JSON.');
        return true;
      }());

      return SystemConfigReverseGeocodingDto(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
      );
    }
    return null;
  }

  static List<SystemConfigReverseGeocodingDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigReverseGeocodingDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigReverseGeocodingDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigReverseGeocodingDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigReverseGeocodingDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigReverseGeocodingDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigReverseGeocodingDto-objects as value to a dart map
  static Map<String, List<SystemConfigReverseGeocodingDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigReverseGeocodingDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigReverseGeocodingDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
  };
}

