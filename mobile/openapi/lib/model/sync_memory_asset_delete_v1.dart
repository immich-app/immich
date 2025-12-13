//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncMemoryAssetDeleteV1 {
  /// Returns a new [SyncMemoryAssetDeleteV1] instance.
  SyncMemoryAssetDeleteV1({
    required this.assetId,
    required this.memoryId,
  });

  String assetId;

  String memoryId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncMemoryAssetDeleteV1 &&
    other.assetId == assetId &&
    other.memoryId == memoryId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (memoryId.hashCode);

  @override
  String toString() => 'SyncMemoryAssetDeleteV1[assetId=$assetId, memoryId=$memoryId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'memoryId'] = this.memoryId;
    return json;
  }

  /// Returns a new [SyncMemoryAssetDeleteV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncMemoryAssetDeleteV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncMemoryAssetDeleteV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncMemoryAssetDeleteV1(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        memoryId: mapValueOfType<String>(json, r'memoryId')!,
      );
    }
    return null;
  }

  static List<SyncMemoryAssetDeleteV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncMemoryAssetDeleteV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncMemoryAssetDeleteV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncMemoryAssetDeleteV1> mapFromJson(dynamic json) {
    final map = <String, SyncMemoryAssetDeleteV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncMemoryAssetDeleteV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncMemoryAssetDeleteV1-objects as value to a dart map
  static Map<String, List<SyncMemoryAssetDeleteV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncMemoryAssetDeleteV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncMemoryAssetDeleteV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'memoryId',
  };
}

