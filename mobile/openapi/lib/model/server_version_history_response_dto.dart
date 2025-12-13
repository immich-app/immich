//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ServerVersionHistoryResponseDto {
  /// Returns a new [ServerVersionHistoryResponseDto] instance.
  ServerVersionHistoryResponseDto({
    required this.createdAt,
    required this.id,
    required this.version,
  });

  DateTime createdAt;

  String id;

  String version;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ServerVersionHistoryResponseDto &&
    other.createdAt == createdAt &&
    other.id == id &&
    other.version == version;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (id.hashCode) +
    (version.hashCode);

  @override
  String toString() => 'ServerVersionHistoryResponseDto[createdAt=$createdAt, id=$id, version=$version]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'id'] = this.id;
      json[r'version'] = this.version;
    return json;
  }

  /// Returns a new [ServerVersionHistoryResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ServerVersionHistoryResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ServerVersionHistoryResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ServerVersionHistoryResponseDto(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        id: mapValueOfType<String>(json, r'id')!,
        version: mapValueOfType<String>(json, r'version')!,
      );
    }
    return null;
  }

  static List<ServerVersionHistoryResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ServerVersionHistoryResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ServerVersionHistoryResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ServerVersionHistoryResponseDto> mapFromJson(dynamic json) {
    final map = <String, ServerVersionHistoryResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ServerVersionHistoryResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ServerVersionHistoryResponseDto-objects as value to a dart map
  static Map<String, List<ServerVersionHistoryResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ServerVersionHistoryResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ServerVersionHistoryResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'id',
    'version',
  };
}

