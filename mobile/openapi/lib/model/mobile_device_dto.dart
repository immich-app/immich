//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MobileDeviceDto {
  /// Returns a new [MobileDeviceDto] instance.
  MobileDeviceDto({
    required this.appVersion,
    required this.deviceOS,
    required this.deviceType,
    required this.lastSeen,
  });

  String appVersion;

  String deviceOS;

  String deviceType;

  DateTime lastSeen;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MobileDeviceDto &&
    other.appVersion == appVersion &&
    other.deviceOS == deviceOS &&
    other.deviceType == deviceType &&
    other.lastSeen == lastSeen;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (appVersion.hashCode) +
    (deviceOS.hashCode) +
    (deviceType.hashCode) +
    (lastSeen.hashCode);

  @override
  String toString() => 'MobileDeviceDto[appVersion=$appVersion, deviceOS=$deviceOS, deviceType=$deviceType, lastSeen=$lastSeen]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'appVersion'] = this.appVersion;
      json[r'deviceOS'] = this.deviceOS;
      json[r'deviceType'] = this.deviceType;
      json[r'lastSeen'] = this.lastSeen.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [MobileDeviceDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MobileDeviceDto? fromJson(dynamic value) {
    upgradeDto(value, "MobileDeviceDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MobileDeviceDto(
        appVersion: mapValueOfType<String>(json, r'appVersion')!,
        deviceOS: mapValueOfType<String>(json, r'deviceOS')!,
        deviceType: mapValueOfType<String>(json, r'deviceType')!,
        lastSeen: mapDateTime(json, r'lastSeen', r'')!,
      );
    }
    return null;
  }

  static List<MobileDeviceDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MobileDeviceDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MobileDeviceDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MobileDeviceDto> mapFromJson(dynamic json) {
    final map = <String, MobileDeviceDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MobileDeviceDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MobileDeviceDto-objects as value to a dart map
  static Map<String, List<MobileDeviceDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MobileDeviceDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MobileDeviceDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'appVersion',
    'deviceOS',
    'deviceType',
    'lastSeen',
  };
}

