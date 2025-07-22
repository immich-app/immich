//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetFaceV1 {
  /// Returns a new [SyncAssetFaceV1] instance.
  SyncAssetFaceV1({
    required this.assetId,
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
    required this.personId,
    required this.sourceType,
  });

  String assetId;

  int boundingBoxX1;

  int boundingBoxX2;

  int boundingBoxY1;

  int boundingBoxY2;

  String id;

  int imageHeight;

  int imageWidth;

  String? personId;

  String sourceType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetFaceV1 &&
    other.assetId == assetId &&
    other.boundingBoxX1 == boundingBoxX1 &&
    other.boundingBoxX2 == boundingBoxX2 &&
    other.boundingBoxY1 == boundingBoxY1 &&
    other.boundingBoxY2 == boundingBoxY2 &&
    other.id == id &&
    other.imageHeight == imageHeight &&
    other.imageWidth == imageWidth &&
    other.personId == personId &&
    other.sourceType == sourceType;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (boundingBoxX1.hashCode) +
    (boundingBoxX2.hashCode) +
    (boundingBoxY1.hashCode) +
    (boundingBoxY2.hashCode) +
    (id.hashCode) +
    (imageHeight.hashCode) +
    (imageWidth.hashCode) +
    (personId == null ? 0 : personId!.hashCode) +
    (sourceType.hashCode);

  @override
  String toString() => 'SyncAssetFaceV1[assetId=$assetId, boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, personId=$personId, sourceType=$sourceType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'boundingBoxX1'] = this.boundingBoxX1;
      json[r'boundingBoxX2'] = this.boundingBoxX2;
      json[r'boundingBoxY1'] = this.boundingBoxY1;
      json[r'boundingBoxY2'] = this.boundingBoxY2;
      json[r'id'] = this.id;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
    if (this.personId != null) {
      json[r'personId'] = this.personId;
    } else {
    //  json[r'personId'] = null;
    }
      json[r'sourceType'] = this.sourceType;
    return json;
  }

  /// Returns a new [SyncAssetFaceV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetFaceV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetFaceV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetFaceV1(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        boundingBoxX1: mapValueOfType<int>(json, r'boundingBoxX1')!,
        boundingBoxX2: mapValueOfType<int>(json, r'boundingBoxX2')!,
        boundingBoxY1: mapValueOfType<int>(json, r'boundingBoxY1')!,
        boundingBoxY2: mapValueOfType<int>(json, r'boundingBoxY2')!,
        id: mapValueOfType<String>(json, r'id')!,
        imageHeight: mapValueOfType<int>(json, r'imageHeight')!,
        imageWidth: mapValueOfType<int>(json, r'imageWidth')!,
        personId: mapValueOfType<String>(json, r'personId'),
        sourceType: mapValueOfType<String>(json, r'sourceType')!,
      );
    }
    return null;
  }

  static List<SyncAssetFaceV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetFaceV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetFaceV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetFaceV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetFaceV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetFaceV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetFaceV1-objects as value to a dart map
  static Map<String, List<SyncAssetFaceV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetFaceV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetFaceV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'boundingBoxX1',
    'boundingBoxX2',
    'boundingBoxY1',
    'boundingBoxY2',
    'id',
    'imageHeight',
    'imageWidth',
    'personId',
    'sourceType',
  };
}

