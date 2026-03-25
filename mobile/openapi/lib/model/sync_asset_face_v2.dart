//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetFaceV2 {
  /// Returns a new [SyncAssetFaceV2] instance.
  SyncAssetFaceV2({
    required this.assetId,
    required this.boundingBoxX1,
    required this.boundingBoxX2,
    required this.boundingBoxY1,
    required this.boundingBoxY2,
    required this.deletedAt,
    required this.id,
    required this.imageHeight,
    required this.imageWidth,
    required this.isVisible,
    required this.personId,
    required this.sourceType,
  });

  /// Asset ID
  String assetId;

  int boundingBoxX1;

  int boundingBoxX2;

  int boundingBoxY1;

  int boundingBoxY2;

  /// Face deleted at
  DateTime? deletedAt;

  /// Asset face ID
  String id;

  int imageHeight;

  int imageWidth;

  /// Is the face visible in the asset
  bool isVisible;

  /// Person ID
  String? personId;

  /// Source type
  String sourceType;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetFaceV2 &&
    other.assetId == assetId &&
    other.boundingBoxX1 == boundingBoxX1 &&
    other.boundingBoxX2 == boundingBoxX2 &&
    other.boundingBoxY1 == boundingBoxY1 &&
    other.boundingBoxY2 == boundingBoxY2 &&
    other.deletedAt == deletedAt &&
    other.id == id &&
    other.imageHeight == imageHeight &&
    other.imageWidth == imageWidth &&
    other.isVisible == isVisible &&
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
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (id.hashCode) +
    (imageHeight.hashCode) +
    (imageWidth.hashCode) +
    (isVisible.hashCode) +
    (personId == null ? 0 : personId!.hashCode) +
    (sourceType.hashCode);

  @override
  String toString() => 'SyncAssetFaceV2[assetId=$assetId, boundingBoxX1=$boundingBoxX1, boundingBoxX2=$boundingBoxX2, boundingBoxY1=$boundingBoxY1, boundingBoxY2=$boundingBoxY2, deletedAt=$deletedAt, id=$id, imageHeight=$imageHeight, imageWidth=$imageWidth, isVisible=$isVisible, personId=$personId, sourceType=$sourceType]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'boundingBoxX1'] = this.boundingBoxX1;
      json[r'boundingBoxX2'] = this.boundingBoxX2;
      json[r'boundingBoxY1'] = this.boundingBoxY1;
      json[r'boundingBoxY2'] = this.boundingBoxY2;
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'id'] = this.id;
      json[r'imageHeight'] = this.imageHeight;
      json[r'imageWidth'] = this.imageWidth;
      json[r'isVisible'] = this.isVisible;
    if (this.personId != null) {
      json[r'personId'] = this.personId;
    } else {
    //  json[r'personId'] = null;
    }
      json[r'sourceType'] = this.sourceType;
    return json;
  }

  /// Returns a new [SyncAssetFaceV2] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetFaceV2? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetFaceV2");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetFaceV2(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        boundingBoxX1: mapValueOfType<int>(json, r'boundingBoxX1')!,
        boundingBoxX2: mapValueOfType<int>(json, r'boundingBoxX2')!,
        boundingBoxY1: mapValueOfType<int>(json, r'boundingBoxY1')!,
        boundingBoxY2: mapValueOfType<int>(json, r'boundingBoxY2')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        id: mapValueOfType<String>(json, r'id')!,
        imageHeight: mapValueOfType<int>(json, r'imageHeight')!,
        imageWidth: mapValueOfType<int>(json, r'imageWidth')!,
        isVisible: mapValueOfType<bool>(json, r'isVisible')!,
        personId: mapValueOfType<String>(json, r'personId'),
        sourceType: mapValueOfType<String>(json, r'sourceType')!,
      );
    }
    return null;
  }

  static List<SyncAssetFaceV2> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetFaceV2>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetFaceV2.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetFaceV2> mapFromJson(dynamic json) {
    final map = <String, SyncAssetFaceV2>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetFaceV2.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetFaceV2-objects as value to a dart map
  static Map<String, List<SyncAssetFaceV2>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetFaceV2>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetFaceV2.listFromJson(entry.value, growable: growable,);
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
    'deletedAt',
    'id',
    'imageHeight',
    'imageWidth',
    'isVisible',
    'personId',
    'sourceType',
  };
}

