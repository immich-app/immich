//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateDeviceInfoDto {
  /// Returns a new [CreateDeviceInfoDto] instance.
  CreateDeviceInfoDto({
    required this.deviceType,
    required this.deviceId,
    this.isAutoBackup,
  });

  DeviceTypeEnum deviceType;

  String deviceId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isAutoBackup;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateDeviceInfoDto &&
     other.deviceType == deviceType &&
     other.deviceId == deviceId &&
     other.isAutoBackup == isAutoBackup;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deviceType.hashCode) +
    (deviceId.hashCode) +
    (isAutoBackup == null ? 0 : isAutoBackup!.hashCode);

  @override
  String toString() => 'CreateDeviceInfoDto[deviceType=$deviceType, deviceId=$deviceId, isAutoBackup=$isAutoBackup]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'deviceType'] = deviceType;
      _json[r'deviceId'] = deviceId;
    if (isAutoBackup != null) {
      _json[r'isAutoBackup'] = isAutoBackup;
    } else {
      _json[r'isAutoBackup'] = null;
    }
    return _json;
  }

  /// Returns a new [CreateDeviceInfoDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateDeviceInfoDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "CreateDeviceInfoDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "CreateDeviceInfoDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return CreateDeviceInfoDto(
        deviceType: DeviceTypeEnum.fromJson(json[r'deviceType'])!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        isAutoBackup: mapValueOfType<bool>(json, r'isAutoBackup'),
      );
    }
    return null;
  }

  static List<CreateDeviceInfoDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateDeviceInfoDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateDeviceInfoDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateDeviceInfoDto> mapFromJson(dynamic json) {
    final map = <String, CreateDeviceInfoDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateDeviceInfoDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateDeviceInfoDto-objects as value to a dart map
  static Map<String, List<CreateDeviceInfoDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateDeviceInfoDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateDeviceInfoDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deviceType',
    'deviceId',
  };
}

