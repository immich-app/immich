//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerStorageResponseDto {
  /// Returns a new [ServerStorageResponseDto] instance.
  ServerStorageResponseDto({
    required this.diskAvailable,
    required this.diskAvailableRaw,
    required this.diskSize,
    required this.diskSizeRaw,
    required this.diskUsagePercentage,
    required this.diskUse,
    required this.diskUseRaw,
  });

  String diskAvailable;

  int diskAvailableRaw;

  String diskSize;

  int diskSizeRaw;

  double diskUsagePercentage;

  String diskUse;

  int diskUseRaw;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerStorageResponseDto &&
    other.diskAvailable == diskAvailable &&
    other.diskAvailableRaw == diskAvailableRaw &&
    other.diskSize == diskSize &&
    other.diskSizeRaw == diskSizeRaw &&
    other.diskUsagePercentage == diskUsagePercentage &&
    other.diskUse == diskUse &&
    other.diskUseRaw == diskUseRaw;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (diskAvailable.hashCode) +
    (diskAvailableRaw.hashCode) +
    (diskSize.hashCode) +
    (diskSizeRaw.hashCode) +
    (diskUsagePercentage.hashCode) +
    (diskUse.hashCode) +
    (diskUseRaw.hashCode);

  @override
  String toString() => 'ServerStorageResponseDto[diskAvailable=$diskAvailable, diskAvailableRaw=$diskAvailableRaw, diskSize=$diskSize, diskSizeRaw=$diskSizeRaw, diskUsagePercentage=$diskUsagePercentage, diskUse=$diskUse, diskUseRaw=$diskUseRaw]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'diskAvailable'] = this.diskAvailable;
      json[r'diskAvailableRaw'] = this.diskAvailableRaw;
      json[r'diskSize'] = this.diskSize;
      json[r'diskSizeRaw'] = this.diskSizeRaw;
      json[r'diskUsagePercentage'] = this.diskUsagePercentage;
      json[r'diskUse'] = this.diskUse;
      json[r'diskUseRaw'] = this.diskUseRaw;
    return json;
  }

  /// Returns a new [ServerStorageResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerStorageResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ServerStorageResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerStorageResponseDto(
        diskAvailable: mapValueOfType<String>(json, r'diskAvailable')!,
        diskAvailableRaw: mapValueOfType<int>(json, r'diskAvailableRaw')!,
        diskSize: mapValueOfType<String>(json, r'diskSize')!,
        diskSizeRaw: mapValueOfType<int>(json, r'diskSizeRaw')!,
        diskUsagePercentage: (mapValueOfType<num>(json, r'diskUsagePercentage')!).toDouble(),
        diskUse: mapValueOfType<String>(json, r'diskUse')!,
        diskUseRaw: mapValueOfType<int>(json, r'diskUseRaw')!,
      );
    }
    return null;
  }

  static List<ServerStorageResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerStorageResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerStorageResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerStorageResponseDto> mapFromJson(dynamic json) {
    final map = <String, ServerStorageResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerStorageResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerStorageResponseDto-objects as value to a dart map
  static Map<String, List<ServerStorageResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerStorageResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerStorageResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'diskAvailable',
    'diskAvailableRaw',
    'diskSize',
    'diskSizeRaw',
    'diskUsagePercentage',
    'diskUse',
    'diskUseRaw',
  };
}

