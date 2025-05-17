//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncUserV1 {
  /// Returns a new [SyncUserV1] instance.
  SyncUserV1({
    required this.deletedAt,
    required this.email,
    required this.id,
    required this.name,
  });

  Option<DateTime>? deletedAt;

  String email;

  String id;

  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncUserV1 &&
    other.deletedAt == deletedAt &&
    other.email == email &&
    other.id == id &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (email.hashCode) +
    (id.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'SyncUserV1[deletedAt=$deletedAt, email=$email, id=$id, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.deletedAt?.isSome ?? false) {
      json[r'deletedAt'] = this.deletedAt!.unwrap().toUtc().toIso8601String();
    } else {
      if(this.deletedAt?.isNone ?? false) {
        json[r'deletedAt'] = null;
      }
    }
      json[r'email'] = this.email;
      json[r'id'] = this.id;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [SyncUserV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncUserV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncUserV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncUserV1(
        deletedAt:  Some.tryFrom(mapDateTime(json, r'deletedAt', r'')),
        email: mapValueOfType<String>(json, r'email')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<SyncUserV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncUserV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncUserV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncUserV1> mapFromJson(dynamic json) {
    final map = <String, SyncUserV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncUserV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncUserV1-objects as value to a dart map
  static Map<String, List<SyncUserV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncUserV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncUserV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'deletedAt',
    'email',
    'id',
    'name',
  };
}

