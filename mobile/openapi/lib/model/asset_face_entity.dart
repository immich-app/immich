//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFaceEntity {
  /// Returns a new [AssetFaceEntity] instance.
  AssetFaceEntity({
    required this.asset,
    required this.assetId,
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    this.faceSearch,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
    required this.person,
    required this.personId,
  });

  AssetEntity asset;

  String assetId;

  num boundingBoxX1;

  num boundingBoxX2;

  num boundingBoxY1;

  num boundingBoxY2;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  FaceSearchEntity? faceSearch;

  String id;

  num imageHeight;

  num imageWidth;

  PersonEntity? person;

  String? personId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFaceEntity &&
    other.asset == asset &&
    other.assetId == assetId &&
    other.boundingBoxX1 == boundingBoxX1 &&
    other.boundingBoxX2 == boundingBoxX2 &&
    other.boundingBoxY1 == boundingBoxY1 &&
    other.boundingBoxY2 == boundingBoxY2 &&
    other.faceSearch == faceSearch &&
    other.id == id &&
    other.imageHeight == imageHeight &&
    other.imageWidth == imageWidth &&
    other.person == person &&
    other.personId == personId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (asset.hashCode) +
    (assetId.hashCode) +
    (boundingBoxX1.hashCode) +
    (boundingBoxX2.hashCode) +
    (boundingBoxY1.hashCode) +
    (boundingBoxY2.hashCode) +
    (faceSearch == null ? 0 : faceSearch!.hashCode) +
    (id.hashCode) +
    (imageHeight.hashCode) +
    (imageWidth.hashCode) +
    (person == null ? 0 : person!.hashCode) +
    (personId == null ? 0 : personId!.hashCode);

  @override
  String toString() => 'AssetFaceEntity[asset=$asset, assetId=$assetId, boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, faceSearch=$faceSearch, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, person=$person, personId=$personId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'asset'] = this.asset;
      json[r'assetId'] = this.assetId;
      json[r'boundingBoxX1'] = this.boundingBoxX1;
      json[r'boundingBoxX2'] = this.boundingBoxX2;
      json[r'boundingBoxY1'] = this.boundingBoxY1;
      json[r'boundingBoxY2'] = this.boundingBoxY2;
    if (this.faceSearch != null) {
      json[r'faceSearch'] = this.faceSearch;
    } else {
    //  json[r'faceSearch'] = null;
    }
      json[r'id'] = this.id;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
    if (this.person != null) {
      json[r'person'] = this.person;
    } else {
    //  json[r'person'] = null;
    }
    if (this.personId != null) {
      json[r'personId'] = this.personId;
    } else {
    //  json[r'personId'] = null;
    }
    return json;
  }

  /// Returns a new [AssetFaceEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFaceEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFaceEntity(
        asset: AssetEntity.fromJson(json[r'asset'])!,
        assetId: mapValueOfType<String>(json, r'assetId')!,
        boundingBoxX1: num.parse('${json[r'boundingBoxX1']}'),
        boundingBoxX2: num.parse('${json[r'boundingBoxX2']}'),
        boundingBoxY1: num.parse('${json[r'boundingBoxY1']}'),
        boundingBoxY2: num.parse('${json[r'boundingBoxY2']}'),
        faceSearch: FaceSearchEntity.fromJson(json[r'faceSearch']),
        id: mapValueOfType<String>(json, r'id')!,
        imageHeight: num.parse('${json[r'imageHeight']}'),
        imageWidth: num.parse('${json[r'imageWidth']}'),
        person: PersonEntity.fromJson(json[r'person']),
        personId: mapValueOfType<String>(json, r'personId'),
      );
    }
    return null;
  }

  static List<AssetFaceEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFaceEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFaceEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFaceEntity> mapFromJson(dynamic json) {
    final map = <String, AssetFaceEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFaceEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFaceEntity-objects as value to a dart map
  static Map<String, List<AssetFaceEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFaceEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFaceEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'asset',
    'assetId',
    'boundingBoxX1',
    'boundingBoxX2',
    'boundingBoxY1',
    'boundingBoxY2',
    'id',
    'imageHeight',
    'imageWidth',
    'person',
    'personId',
  };
}

