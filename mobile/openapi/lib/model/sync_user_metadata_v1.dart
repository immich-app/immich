//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncUserMetadataV1 {
  /// Returns a new [SyncUserMetadataV1] instance.
  SyncUserMetadataV1({
    required this.key,
    required this.userId,
    required this.value,
  });

  UserMetadataKey key;

  String userId;

  Object value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncUserMetadataV1 &&
    other.key == key &&
    other.userId == userId &&
    other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (key.hashCode) +
    (userId.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'SyncUserMetadataV1[key=$key, userId=$userId, value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'key'] = this.key;
      json[r'userId'] = this.userId;
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [SyncUserMetadataV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncUserMetadataV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncUserMetadataV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncUserMetadataV1(
        key: UserMetadataKey.fromJson(json[r'key'])!,
        userId: mapValueOfType<String>(json, r'userId')!,
        value: mapValueOfType<Object>(json, r'value')!,
      );
    }
    return null;
  }

  static List<SyncUserMetadataV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncUserMetadataV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncUserMetadataV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncUserMetadataV1> mapFromJson(dynamic json) {
    final map = <String, SyncUserMetadataV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncUserMetadataV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncUserMetadataV1-objects as value to a dart map
  static Map<String, List<SyncUserMetadataV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncUserMetadataV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncUserMetadataV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'key',
    'userId',
    'value',
  };
}

