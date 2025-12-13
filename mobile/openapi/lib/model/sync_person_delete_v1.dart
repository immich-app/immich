//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncPersonDeleteV1 {
  /// Returns a new [SyncPersonDeleteV1] instance.
  SyncPersonDeleteV1({
    required this.personId,
  });

  String personId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncPersonDeleteV1 &&
    other.personId == personId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (personId.hashCode);

  @override
  String toString() => 'SyncPersonDeleteV1[personId=$personId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'personId'] = this.personId;
    return json;
  }

  /// Returns a new [SyncPersonDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncPersonDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncPersonDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncPersonDeleteV1(
        personId: mapValueOfType<String>(json, r'personId')!,
      );
    }
    return null;
  }

  static List<SyncPersonDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncPersonDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncPersonDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncPersonDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncPersonDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncPersonDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncPersonDeleteV1-objects as value to a dart map
  static Map<String, List<SyncPersonDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncPersonDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncPersonDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'personId',
  };
}

