//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CheckExistingAssetsDto {
  /// Returns a new [CheckExistingAssetsDto] instance.
  CheckExistingAssetsDto({
    this.deviceAssetIds = const [],
    required this.deviceId,
  });

  List<String> deviceAssetIds;

  String deviceId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CheckExistingAssetsDto &&
    _deepEquality.equals(other.deviceAssetIds, deviceAssetIds) &&
    other.deviceId == deviceId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deviceAssetIds.hashCode) +
    (deviceId.hashCode);

  @override
  String toString() => 'CheckExistingAssetsDto[deviceAssetIds=$deviceAssetIds, deviceId=$deviceId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'deviceAssetIds'] = this.deviceAssetIds;
      json[r'deviceId'] = this.deviceId;
    return json;
  }

  /// Returns a new [CheckExistingAssetsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CheckExistingAssetsDto? fromJson(dynamic value) {
    upgradeDto(value, "CheckExistingAssetsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CheckExistingAssetsDto(
        deviceAssetIds: json[r'deviceAssetIds'] is Iterable
            ? (json[r'deviceAssetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
      );
    }
    return null;
  }

  static List<CheckExistingAssetsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CheckExistingAssetsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CheckExistingAssetsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CheckExistingAssetsDto> mapFromJson(dynamic json) {
    final map = <String, CheckExistingAssetsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CheckExistingAssetsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CheckExistingAssetsDto-objects as value to a dart map
  static Map<String, List<CheckExistingAssetsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CheckExistingAssetsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CheckExistingAssetsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deviceAssetIds',
    'deviceId',
  };
}

