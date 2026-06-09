//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncPartnerV1 {
  /// Returns a new [SyncPartnerV1] instance.
  SyncPartnerV1({
    required this.inTimeline,
    required this.sharedById,
    required this.sharedWithId,
  });

  /// In timeline
  bool inTimeline;

  /// Shared by ID
  String sharedById;

  /// Shared with ID
  String sharedWithId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncPartnerV1 &&
    other.inTimeline == inTimeline &&
    other.sharedById == sharedById &&
    other.sharedWithId == sharedWithId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (inTimeline.hashCode) +
    (sharedById.hashCode) +
    (sharedWithId.hashCode);

  @override
  String toString() => 'SyncPartnerV1[inTimeline=$inTimeline, sharedById=$sharedById, sharedWithId=$sharedWithId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'inTimeline'] = this.inTimeline;
      json[r'sharedById'] = this.sharedById;
      json[r'sharedWithId'] = this.sharedWithId;
    return json;
  }

  /// Returns a new [SyncPartnerV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncPartnerV1? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'inTimeline'), 'Required key "SyncPartnerV1[inTimeline]" is missing from JSON.');
        assert(json[r'inTimeline'] != null, 'Required key "SyncPartnerV1[inTimeline]" has a null value in JSON.');
        assert(json.containsKey(r'sharedById'), 'Required key "SyncPartnerV1[sharedById]" is missing from JSON.');
        assert(json[r'sharedById'] != null, 'Required key "SyncPartnerV1[sharedById]" has a null value in JSON.');
        assert(json.containsKey(r'sharedWithId'), 'Required key "SyncPartnerV1[sharedWithId]" is missing from JSON.');
        assert(json[r'sharedWithId'] != null, 'Required key "SyncPartnerV1[sharedWithId]" has a null value in JSON.');
        return true;
      }());

      return SyncPartnerV1(
        inTimeline: mapValueOfType<bool>(json, r'inTimeline')!,
        sharedById: mapValueOfType<String>(json, r'sharedById')!,
        sharedWithId: mapValueOfType<String>(json, r'sharedWithId')!,
      );
    }
    return null;
  }

  static List<SyncPartnerV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncPartnerV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncPartnerV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncPartnerV1> mapFromJson(dynamic json) {
    final map = <String, SyncPartnerV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncPartnerV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncPartnerV1-objects as value to a dart map
  static Map<String, List<SyncPartnerV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncPartnerV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncPartnerV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'inTimeline',
    'sharedById',
    'sharedWithId',
  };
}

