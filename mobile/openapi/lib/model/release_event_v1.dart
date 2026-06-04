//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ReleaseEventV1 {
  /// Returns a new [ReleaseEventV1] instance.
  ReleaseEventV1({
    required this.checkedAt,
    required this.isAvailable,
    required this.releaseVersion,
    required this.serverVersion,
    required this.type,
  });

  /// When the server last checked for a latest version. As an ISO timestamp
  String checkedAt;

  /// Whether a new version is available
  bool isAvailable;

  ServerVersionResponseDto releaseVersion;

  ServerVersionResponseDto serverVersion;

  ReleaseType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ReleaseEventV1 &&
    other.checkedAt == checkedAt &&
    other.isAvailable == isAvailable &&
    other.releaseVersion == releaseVersion &&
    other.serverVersion == serverVersion &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checkedAt.hashCode) +
    (isAvailable.hashCode) +
    (releaseVersion.hashCode) +
    (serverVersion.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'ReleaseEventV1[checkedAt=$checkedAt, isAvailable=$isAvailable, releaseVersion=$releaseVersion, serverVersion=$serverVersion, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checkedAt'] = this.checkedAt;
      json[r'isAvailable'] = this.isAvailable;
      json[r'releaseVersion'] = this.releaseVersion;
      json[r'serverVersion'] = this.serverVersion;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [ReleaseEventV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ReleaseEventV1? fromJson(dynamic value) {
    upgradeDto(value, "ReleaseEventV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ReleaseEventV1(
        checkedAt: mapValueOfType<String>(json, r'checkedAt')!,
        isAvailable: mapValueOfType<bool>(json, r'isAvailable')!,
        releaseVersion: ServerVersionResponseDto.fromJson(json[r'releaseVersion'])!,
        serverVersion: ServerVersionResponseDto.fromJson(json[r'serverVersion'])!,
        type: ReleaseType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<ReleaseEventV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ReleaseEventV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ReleaseEventV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ReleaseEventV1> mapFromJson(dynamic json) {
    final map = <String, ReleaseEventV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ReleaseEventV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ReleaseEventV1-objects as value to a dart map
  static Map<String, List<ReleaseEventV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ReleaseEventV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ReleaseEventV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checkedAt',
    'isAvailable',
    'releaseVersion',
    'serverVersion',
    'type',
  };
}

