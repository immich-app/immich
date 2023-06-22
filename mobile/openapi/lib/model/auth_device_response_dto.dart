//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AuthDeviceResponseDto {
  /// Returns a new [AuthDeviceResponseDto] instance.
  AuthDeviceResponseDto({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    required this.current,
    required this.deviceType,
    required this.deviceOS,
  });

  String id;

  String createdAt;

  String updatedAt;

  bool current;

  String deviceType;

  String deviceOS;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AuthDeviceResponseDto &&
     other.id == id &&
     other.createdAt == createdAt &&
     other.updatedAt == updatedAt &&
     other.current == current &&
     other.deviceType == deviceType &&
     other.deviceOS == deviceOS;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode) +
    (current.hashCode) +
    (deviceType.hashCode) +
    (deviceOS.hashCode);

  @override
  String toString() => 'AuthDeviceResponseDto[id=$id, createdAt=$createdAt, updatedAt=$updatedAt, current=$current, deviceType=$deviceType, deviceOS=$deviceOS]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'createdAt'] = this.createdAt;
      json[r'updatedAt'] = this.updatedAt;
      json[r'current'] = this.current;
      json[r'deviceType'] = this.deviceType;
      json[r'deviceOS'] = this.deviceOS;
    return json;
  }

  /// Returns a new [AuthDeviceResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AuthDeviceResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AuthDeviceResponseDto[$key]" is missing from JSON.');
          // assert(json[key] != null, 'Required key "AuthDeviceResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AuthDeviceResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
        current: mapValueOfType<bool>(json, r'current')!,
        deviceType: mapValueOfType<String>(json, r'deviceType')!,
        deviceOS: mapValueOfType<String>(json, r'deviceOS')!,
      );
    }
    return null;
  }

  static List<AuthDeviceResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AuthDeviceResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AuthDeviceResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AuthDeviceResponseDto> mapFromJson(dynamic json) {
    final map = <String, AuthDeviceResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AuthDeviceResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AuthDeviceResponseDto-objects as value to a dart map
  static Map<String, List<AuthDeviceResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AuthDeviceResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AuthDeviceResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'createdAt',
    'updatedAt',
    'current',
    'deviceType',
    'deviceOS',
  };
}

