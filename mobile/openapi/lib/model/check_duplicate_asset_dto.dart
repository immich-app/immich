//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CheckDuplicateAssetDto {
  /// Returns a new [CheckDuplicateAssetDto] instance.
  CheckDuplicateAssetDto({
    required this.deviceAssetId,
    required this.deviceId,
  });

  String deviceAssetId;

  String deviceId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CheckDuplicateAssetDto &&
     other.deviceAssetId == deviceAssetId &&
     other.deviceId == deviceId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deviceAssetId.hashCode) +
    (deviceId.hashCode);

  @override
  String toString() => 'CheckDuplicateAssetDto[deviceAssetId=$deviceAssetId, deviceId=$deviceId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
    return json;
  }

  /// Returns a new [CheckDuplicateAssetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CheckDuplicateAssetDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "CheckDuplicateAssetDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "CheckDuplicateAssetDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return CheckDuplicateAssetDto(
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
      );
    }
    return null;
  }

  static List<CheckDuplicateAssetDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CheckDuplicateAssetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CheckDuplicateAssetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CheckDuplicateAssetDto> mapFromJson(dynamic json) {
    final map = <String, CheckDuplicateAssetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CheckDuplicateAssetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CheckDuplicateAssetDto-objects as value to a dart map
  static Map<String, List<CheckDuplicateAssetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CheckDuplicateAssetDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CheckDuplicateAssetDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deviceAssetId',
    'deviceId',
  };
}

