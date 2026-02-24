//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetEditDeleteV1 {
  /// Returns a new [SyncAssetEditDeleteV1] instance.
  SyncAssetEditDeleteV1({
    required this.editId,
  });

  String editId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetEditDeleteV1 &&
    other.editId == editId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (editId.hashCode);

  @override
  String toString() => 'SyncAssetEditDeleteV1[editId=$editId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'editId'] = this.editId;
    return json;
  }

  /// Returns a new [SyncAssetEditDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetEditDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetEditDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetEditDeleteV1(
        editId: mapValueOfType<String>(json, r'editId')!,
      );
    }
    return null;
  }

  static List<SyncAssetEditDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetEditDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetEditDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetEditDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetEditDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetEditDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetEditDeleteV1-objects as value to a dart map
  static Map<String, List<SyncAssetEditDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetEditDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetEditDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'editId',
  };
}

