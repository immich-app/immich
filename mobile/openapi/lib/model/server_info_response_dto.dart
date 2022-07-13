//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerInfoResponseDto {
  /// Returns a new [ServerInfoResponseDto] instance.
  ServerInfoResponseDto({
    required this.diskSizeRaw,
    required this.diskUseRaw,
    required this.diskAvailableRaw,
    required this.diskUsagePercentage,
    required this.diskSize,
    required this.diskUse,
    required this.diskAvailable,
  });

  int diskSizeRaw;

  int diskUseRaw;

  int diskAvailableRaw;

  double diskUsagePercentage;

  String diskSize;

  String diskUse;

  String diskAvailable;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerInfoResponseDto &&
     other.diskSizeRaw == diskSizeRaw &&
     other.diskUseRaw == diskUseRaw &&
     other.diskAvailableRaw == diskAvailableRaw &&
     other.diskUsagePercentage == diskUsagePercentage &&
     other.diskSize == diskSize &&
     other.diskUse == diskUse &&
     other.diskAvailable == diskAvailable;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (diskSizeRaw.hashCode) +
    (diskUseRaw.hashCode) +
    (diskAvailableRaw.hashCode) +
    (diskUsagePercentage.hashCode) +
    (diskSize.hashCode) +
    (diskUse.hashCode) +
    (diskAvailable.hashCode);

  @override
  String toString() => 'ServerInfoResponseDto[diskSizeRaw=$diskSizeRaw, diskUseRaw=$diskUseRaw, diskAvailableRaw=$diskAvailableRaw, diskUsagePercentage=$diskUsagePercentage, diskSize=$diskSize, diskUse=$diskUse, diskAvailable=$diskAvailable]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'diskSizeRaw'] = diskSizeRaw;
      _json[r'diskUseRaw'] = diskUseRaw;
      _json[r'diskAvailableRaw'] = diskAvailableRaw;
      _json[r'diskUsagePercentage'] = diskUsagePercentage;
      _json[r'diskSize'] = diskSize;
      _json[r'diskUse'] = diskUse;
      _json[r'diskAvailable'] = diskAvailable;
    return _json;
  }

  /// Returns a new [ServerInfoResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerInfoResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "ServerInfoResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "ServerInfoResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return ServerInfoResponseDto(
        diskSizeRaw: mapValueOfType<int>(json, r'diskSizeRaw')!,
        diskUseRaw: mapValueOfType<int>(json, r'diskUseRaw')!,
        diskAvailableRaw: mapValueOfType<int>(json, r'diskAvailableRaw')!,
        diskUsagePercentage: mapValueOfType<double>(json, r'diskUsagePercentage')!,
        diskSize: mapValueOfType<String>(json, r'diskSize')!,
        diskUse: mapValueOfType<String>(json, r'diskUse')!,
        diskAvailable: mapValueOfType<String>(json, r'diskAvailable')!,
      );
    }
    return null;
  }

  static List<ServerInfoResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerInfoResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerInfoResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerInfoResponseDto> mapFromJson(dynamic json) {
    final map = <String, ServerInfoResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerInfoResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerInfoResponseDto-objects as value to a dart map
  static Map<String, List<ServerInfoResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerInfoResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerInfoResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'diskSizeRaw',
    'diskUseRaw',
    'diskAvailableRaw',
    'diskUsagePercentage',
    'diskSize',
    'diskUse',
    'diskAvailable',
  };
}

