//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetMetadataDeleteV1 {
  /// Returns a new [SyncAssetMetadataDeleteV1] instance.
  SyncAssetMetadataDeleteV1({
    required this.assetId,
    required this.key,
  });

  String assetId;

  String key;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetMetadataDeleteV1 &&
    other.assetId == assetId &&
    other.key == key;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (key.hashCode);

  @override
  String toString() => 'SyncAssetMetadataDeleteV1[assetId=$assetId, key=$key]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'key'] = this.key;
    return json;
  }

  /// Returns a new [SyncAssetMetadataDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetMetadataDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetMetadataDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetMetadataDeleteV1(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        key: mapValueOfType<String>(json, r'key')!,
      );
    }
    return null;
  }

  static List<SyncAssetMetadataDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetMetadataDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetMetadataDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetMetadataDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetMetadataDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetMetadataDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetMetadataDeleteV1-objects as value to a dart map
  static Map<String, List<SyncAssetMetadataDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetMetadataDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetMetadataDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'key',
  };
}

