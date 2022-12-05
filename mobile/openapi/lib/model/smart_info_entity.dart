//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartInfoEntity {
  /// Returns a new [SmartInfoEntity] instance.
  SmartInfoEntity({
    required this.id,
    required this.assetId,
    this.tags = const [],
    this.objects = const [],
    this.asset,
  });

  String id;

  String assetId;

  List<String>? tags;

  List<String>? objects;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetEntity? asset;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartInfoEntity &&
     other.id == id &&
     other.assetId == assetId &&
     other.tags == tags &&
     other.objects == objects &&
     other.asset == asset;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (assetId.hashCode) +
    (tags == null ? 0 : tags!.hashCode) +
    (objects == null ? 0 : objects!.hashCode) +
    (asset == null ? 0 : asset!.hashCode);

  @override
  String toString() => 'SmartInfoEntity[id=$id, assetId=$assetId, tags=$tags, objects=$objects, asset=$asset]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'id'] = id;
      _json[r'assetId'] = assetId;
    if (tags != null) {
      _json[r'tags'] = tags;
    } else {
      _json[r'tags'] = null;
    }
    if (objects != null) {
      _json[r'objects'] = objects;
    } else {
      _json[r'objects'] = null;
    }
    if (asset != null) {
      _json[r'asset'] = asset;
    } else {
      _json[r'asset'] = null;
    }
    return _json;
  }

  /// Returns a new [SmartInfoEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartInfoEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SmartInfoEntity[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SmartInfoEntity[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SmartInfoEntity(
        id: mapValueOfType<String>(json, r'id')!,
        assetId: mapValueOfType<String>(json, r'assetId')!,
        tags: json[r'tags'] is List
            ? (json[r'tags'] as List).cast<String>()
            : const [],
        objects: json[r'objects'] is List
            ? (json[r'objects'] as List).cast<String>()
            : const [],
        asset: AssetEntity.fromJson(json[r'asset']),
      );
    }
    return null;
  }

  static List<SmartInfoEntity>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartInfoEntity.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'assetId',
    'tags',
    'objects',
  };
}

