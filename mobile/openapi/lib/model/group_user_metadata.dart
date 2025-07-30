//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class GroupUserMetadata {
  /// Returns a new [GroupUserMetadata] instance.
  GroupUserMetadata({
    required this.createdAt,
    required this.updatedAt,
  });

  DateTime createdAt;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is GroupUserMetadata &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'GroupUserMetadata[createdAt=$createdAt, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [GroupUserMetadata] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static GroupUserMetadata? fromJson(dynamic value) {
    upgradeDto(value, "GroupUserMetadata");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return GroupUserMetadata(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<GroupUserMetadata> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <GroupUserMetadata>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = GroupUserMetadata.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, GroupUserMetadata> mapFromJson(dynamic json) {
    final map = <String, GroupUserMetadata>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = GroupUserMetadata.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of GroupUserMetadata-objects as value to a dart map
  static Map<String, List<GroupUserMetadata>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<GroupUserMetadata>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = GroupUserMetadata.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'updatedAt',
  };
}

