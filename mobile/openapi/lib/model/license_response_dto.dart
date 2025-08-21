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
    required this.activatedAt,
    required this.activationKey,
    required this.licenseKey,
  });

  DateTime activatedAt;

  String activationKey;

  String licenseKey;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LicenseResponseDto &&
    other.activatedAt == activatedAt &&
    other.activationKey == activationKey &&
    other.licenseKey == licenseKey;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (activatedAt.hashCode) +
    (activationKey.hashCode) +
    (licenseKey.hashCode);

  @override
  String toString() => 'LicenseResponseDto[activatedAt=$activatedAt, activationKey=$activationKey, licenseKey=$licenseKey]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'activatedAt'] = this.activatedAt.toUtc().toIso8601String();
      json[r'activationKey'] = this.activationKey;
      json[r'licenseKey'] = this.licenseKey;
    return json;
  }

  /// Returns a new [LicenseResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LicenseResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "LicenseResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LicenseResponseDto(
        activatedAt: mapDateTime(json, r'activatedAt', r'')!,
        activationKey: mapValueOfType<String>(json, r'activationKey')!,
        licenseKey: mapValueOfType<String>(json, r'licenseKey')!,
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
    'activatedAt',
    'activationKey',
    'licenseKey',
  };
}

