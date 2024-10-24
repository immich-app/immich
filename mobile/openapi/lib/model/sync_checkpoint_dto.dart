//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncCheckpointDto {
  /// Returns a new [SyncCheckpointDto] instance.
  SyncCheckpointDto({
    required this.id,
    required this.timestamp,
  });

  String id;

  String timestamp;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncCheckpointDto &&
    other.id == id &&
    other.timestamp == timestamp;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (timestamp.hashCode);

  @override
  String toString() => 'SyncCheckpointDto[id=$id, timestamp=$timestamp]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'timestamp'] = this.timestamp;
    return json;
  }

  /// Returns a new [SyncCheckpointDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncCheckpointDto? fromJson(dynamic value) {
    upgradeDto(value, "SyncCheckpointDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncCheckpointDto(
        id: mapValueOfType<String>(json, r'id')!,
        timestamp: mapValueOfType<String>(json, r'timestamp')!,
      );
    }
    return null;
  }

  static List<SyncCheckpointDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncCheckpointDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncCheckpointDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncCheckpointDto> mapFromJson(dynamic json) {
    final map = <String, SyncCheckpointDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncCheckpointDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncCheckpointDto-objects as value to a dart map
  static Map<String, List<SyncCheckpointDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncCheckpointDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncCheckpointDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'timestamp',
  };
}

