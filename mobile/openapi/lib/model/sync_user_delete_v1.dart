//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncUserDeleteV1 {
  /// Returns a new [SyncUserDeleteV1] instance.
  SyncUserDeleteV1({
    required this.userId,
  });

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncUserDeleteV1 &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (userId.hashCode);

  @override
  String toString() => 'SyncUserDeleteV1[userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [SyncUserDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncUserDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncUserDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncUserDeleteV1(
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<SyncUserDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncUserDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncUserDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncUserDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncUserDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncUserDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncUserDeleteV1-objects as value to a dart map
  static Map<String, List<SyncUserDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncUserDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncUserDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'userId',
  };
}

