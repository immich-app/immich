//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartInfoEntity {
  /// Returns a new [SmartInfoEntity] instance.
  SmartInfoEntity({
    this.asset,
    required this.assetId,
    this.objects = const [],
    this.tags = const [],
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetEntity? asset;

  String assetId;

  List<String>? objects;

  List<String>? tags;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartInfoEntity &&
    other.asset == asset &&
    other.assetId == assetId &&
    _deepEquality.equals(other.objects, objects) &&
    _deepEquality.equals(other.tags, tags);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (asset == null ? 0 : asset!.hashCode) +
    (assetId.hashCode) +
    (objects == null ? 0 : objects!.hashCode) +
    (tags == null ? 0 : tags!.hashCode);

  @override
  String toString() => 'SmartInfoEntity[asset=$asset, assetId=$assetId, objects=$objects, tags=$tags]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.asset != null) {
      json[r'asset'] = this.asset;
    } else {
    //  json[r'asset'] = null;
    }
      json[r'assetId'] = this.assetId;
    if (this.objects != null) {
      json[r'objects'] = this.objects;
    } else {
    //  json[r'objects'] = null;
    }
    if (this.tags != null) {
      json[r'tags'] = this.tags;
    } else {
    //  json[r'tags'] = null;
    }
    return json;
  }

  /// Returns a new [SmartInfoEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartInfoEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SmartInfoEntity(
        asset: AssetEntity.fromJson(json[r'asset']),
        assetId: mapValueOfType<String>(json, r'assetId')!,
        objects: json[r'objects'] is Iterable
            ? (json[r'objects'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        tags: json[r'tags'] is Iterable
            ? (json[r'tags'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<SmartInfoEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SmartInfoEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SmartInfoEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SmartInfoEntity> mapFromJson(dynamic json) {
    final map = <String, SmartInfoEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartInfoEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SmartInfoEntity-objects as value to a dart map
  static Map<String, List<SmartInfoEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SmartInfoEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SmartInfoEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'objects',
    'tags',
  };
}

