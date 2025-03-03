//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncPartnerDeleteV1 {
  /// Returns a new [SyncPartnerDeleteV1] instance.
  SyncPartnerDeleteV1({
    required this.sharedById,
    required this.sharedWithId,
  });

  String sharedById;

  String sharedWithId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncPartnerDeleteV1 &&
    other.sharedById == sharedById &&
    other.sharedWithId == sharedWithId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sharedById.hashCode) +
    (sharedWithId.hashCode);

  @override
  String toString() => 'SyncPartnerDeleteV1[sharedById=$sharedById, sharedWithId=$sharedWithId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'sharedById'] = this.sharedById;
      json[r'sharedWithId'] = this.sharedWithId;
    return json;
  }

  /// Returns a new [SyncPartnerDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncPartnerDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncPartnerDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncPartnerDeleteV1(
        sharedById: mapValueOfType<String>(json, r'sharedById')!,
        sharedWithId: mapValueOfType<String>(json, r'sharedWithId')!,
      );
    }
    return null;
  }

  static List<SyncPartnerDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncPartnerDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncPartnerDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncPartnerDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncPartnerDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncPartnerDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncPartnerDeleteV1-objects as value to a dart map
  static Map<String, List<SyncPartnerDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncPartnerDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncPartnerDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sharedById',
    'sharedWithId',
  };
}

