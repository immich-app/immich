//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigDisplayDto {
  /// Returns a new [SystemConfigDisplayDto] instance.
  SystemConfigDisplayDto({
    required this.accentColor,
    required this.darkAccentColor,
  });

  String accentColor;

  String darkAccentColor;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigDisplayDto &&
     other.accentColor == accentColor &&
     other.darkAccentColor == darkAccentColor;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (accentColor.hashCode) +
    (darkAccentColor.hashCode);

  @override
  String toString() => 'SystemConfigDisplayDto[accentColor=$accentColor, darkAccentColor=$darkAccentColor]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'accentColor'] = this.accentColor;
      json[r'darkAccentColor'] = this.darkAccentColor;
    return json;
  }

  /// Returns a new [SystemConfigDisplayDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigDisplayDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigDisplayDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigDisplayDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigDisplayDto(
        accentColor: mapValueOfType<String>(json, r'accentColor')!,
        darkAccentColor: mapValueOfType<String>(json, r'darkAccentColor')!,
      );
    }
    return null;
  }

  static List<SystemConfigDisplayDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigDisplayDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigDisplayDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigDisplayDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigDisplayDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigDisplayDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigDisplayDto-objects as value to a dart map
  static Map<String, List<SystemConfigDisplayDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigDisplayDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigDisplayDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'accentColor',
    'darkAccentColor',
  };
}

