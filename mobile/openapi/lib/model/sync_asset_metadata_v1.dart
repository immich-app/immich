//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetMetadataV1 {
  /// Returns a new [SyncAssetMetadataV1] instance.
  SyncAssetMetadataV1({
    required this.assetId,
    required this.key,
    required this.value,
  });

  String assetId;

  String key;

  Object value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetMetadataV1 &&
    other.assetId == assetId &&
    other.key == key &&
    other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (key.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'SyncAssetMetadataV1[assetId=$assetId, key=$key, value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'key'] = this.key;
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [SyncAssetMetadataV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetMetadataV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetMetadataV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetMetadataV1(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        key: mapValueOfType<String>(json, r'key')!,
        value: mapValueOfType<Object>(json, r'value')!,
      );
    }
    return null;
  }

  static List<SyncAssetMetadataV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetMetadataV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetMetadataV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetMetadataV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetMetadataV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetMetadataV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetMetadataV1-objects as value to a dart map
  static Map<String, List<SyncAssetMetadataV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetMetadataV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetMetadataV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'key',
    'value',
  };
}

