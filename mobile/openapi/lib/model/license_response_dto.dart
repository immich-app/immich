//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LicenseResponseDto {
  /// Returns a new [LicenseResponseDto] instance.
  LicenseResponseDto({
    required this.valid,
  });

  bool valid;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LicenseResponseDto &&
    other.valid == valid;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (valid.hashCode);

  @override
  String toString() => 'LicenseResponseDto[valid=$valid]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'valid'] = this.valid;
    return json;
  }

  /// Returns a new [LicenseResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LicenseResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LicenseResponseDto(
        valid: mapValueOfType<bool>(json, r'valid')!,
      );
    }
    return null;
  }

  static List<LicenseResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LicenseResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LicenseResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LicenseResponseDto> mapFromJson(dynamic json) {
    final map = <String, LicenseResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LicenseResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LicenseResponseDto-objects as value to a dart map
  static Map<String, List<LicenseResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LicenseResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LicenseResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'valid',
  };
}

