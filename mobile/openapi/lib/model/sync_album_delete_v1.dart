//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAlbumDeleteV1 {
  /// Returns a new [SyncAlbumDeleteV1] instance.
  SyncAlbumDeleteV1({
    required this.albumId,
  });

  String albumId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAlbumDeleteV1 &&
    other.albumId == albumId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode);

  @override
  String toString() => 'SyncAlbumDeleteV1[albumId=$albumId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
    return json;
  }

  /// Returns a new [SyncAlbumDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAlbumDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAlbumDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAlbumDeleteV1(
        albumId: mapValueOfType<String>(json, r'albumId')!,
      );
    }
    return null;
  }

  static List<SyncAlbumDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAlbumDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAlbumDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAlbumDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncAlbumDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAlbumDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAlbumDeleteV1-objects as value to a dart map
  static Map<String, List<SyncAlbumDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAlbumDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAlbumDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
  };
}

