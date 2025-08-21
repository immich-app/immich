//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAlbumUserV1 {
  /// Returns a new [SyncAlbumUserV1] instance.
  SyncAlbumUserV1({
    required this.albumId,
    required this.role,
    required this.userId,
  });

  String albumId;

  AlbumUserRole role;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAlbumUserV1 &&
    other.albumId == albumId &&
    other.role == role &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (role.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'SyncAlbumUserV1[albumId=$albumId, role=$role, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
      json[r'role'] = this.role;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [SyncAlbumUserV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAlbumUserV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAlbumUserV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAlbumUserV1(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        role: AlbumUserRole.fromJson(json[r'role'])!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<SyncAlbumUserV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAlbumUserV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAlbumUserV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAlbumUserV1> mapFromJson(dynamic json) {
    final map = <String, SyncAlbumUserV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAlbumUserV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAlbumUserV1-objects as value to a dart map
  static Map<String, List<SyncAlbumUserV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAlbumUserV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAlbumUserV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'role',
    'userId',
  };
}

