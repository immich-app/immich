//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DeviceInfoResponseDto {
  /// Returns a new [DeviceInfoResponseDto] instance.
  DeviceInfoResponseDto({
    required this.id,
    required this.deviceType,
    required this.userId,
    required this.deviceId,
    required this.createdAt,
    required this.isAutoBackup,
  });

  int id;

  DeviceTypeEnum deviceType;

  String userId;

  String deviceId;

  String createdAt;

  bool isAutoBackup;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DeviceInfoResponseDto &&
     other.id == id &&
     other.deviceType == deviceType &&
     other.userId == userId &&
     other.deviceId == deviceId &&
     other.createdAt == createdAt &&
     other.isAutoBackup == isAutoBackup;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (deviceType.hashCode) +
    (userId.hashCode) +
    (deviceId.hashCode) +
    (createdAt.hashCode) +
    (isAutoBackup.hashCode);

  @override
  String toString() => 'DeviceInfoResponseDto[id=$id, deviceType=$deviceType, userId=$userId, deviceId=$deviceId, createdAt=$createdAt, isAutoBackup=$isAutoBackup]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'deviceType'] = this.deviceType;
      json[r'userId'] = this.userId;
      json[r'deviceId'] = this.deviceId;
      json[r'createdAt'] = this.createdAt;
      json[r'isAutoBackup'] = this.isAutoBackup;
    return json;
  }

  /// Returns a new [DeviceInfoResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DeviceInfoResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "DeviceInfoResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "DeviceInfoResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return DeviceInfoResponseDto(
        id: mapValueOfType<int>(json, r'id')!,
        deviceType: DeviceTypeEnum.fromJson(json[r'deviceType'])!,
        userId: mapValueOfType<String>(json, r'userId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        isAutoBackup: mapValueOfType<bool>(json, r'isAutoBackup')!,
      );
    }
    return null;
  }

  static List<DeviceInfoResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DeviceInfoResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DeviceInfoResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DeviceInfoResponseDto> mapFromJson(dynamic json) {
    final map = <String, DeviceInfoResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DeviceInfoResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DeviceInfoResponseDto-objects as value to a dart map
  static Map<String, List<DeviceInfoResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DeviceInfoResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DeviceInfoResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'deviceType',
    'userId',
    'deviceId',
    'createdAt',
    'isAutoBackup',
  };
}

