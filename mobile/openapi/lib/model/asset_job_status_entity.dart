//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetJobStatusEntity {
  /// Returns a new [AssetJobStatusEntity] instance.
  AssetJobStatusEntity({
    required this.asset,
    required this.assetId,
    required this.duplicatesDetectedAt,
    required this.facesRecognizedAt,
    required this.metadataExtractedAt,
    required this.previewAt,
    required this.thumbnailAt,
  });

  AssetEntity asset;

  String assetId;

  DateTime? duplicatesDetectedAt;

  DateTime? facesRecognizedAt;

  DateTime? metadataExtractedAt;

  DateTime? previewAt;

  DateTime? thumbnailAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetJobStatusEntity &&
    other.asset == asset &&
    other.assetId == assetId &&
    other.duplicatesDetectedAt == duplicatesDetectedAt &&
    other.facesRecognizedAt == facesRecognizedAt &&
    other.metadataExtractedAt == metadataExtractedAt &&
    other.previewAt == previewAt &&
    other.thumbnailAt == thumbnailAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (asset.hashCode) +
    (assetId.hashCode) +
    (duplicatesDetectedAt == null ? 0 : duplicatesDetectedAt!.hashCode) +
    (facesRecognizedAt == null ? 0 : facesRecognizedAt!.hashCode) +
    (metadataExtractedAt == null ? 0 : metadataExtractedAt!.hashCode) +
    (previewAt == null ? 0 : previewAt!.hashCode) +
    (thumbnailAt == null ? 0 : thumbnailAt!.hashCode);

  @override
  String toString() => 'AssetJobStatusEntity[asset=$asset, assetId=$assetId, duplicatesDetectedAt=$duplicatesDetectedAt, facesRecognizedAt=$facesRecognizedAt, metadataExtractedAt=$metadataExtractedAt, previewAt=$previewAt, thumbnailAt=$thumbnailAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'asset'] = this.asset;
      json[r'assetId'] = this.assetId;
    if (this.duplicatesDetectedAt != null) {
      json[r'duplicatesDetectedAt'] = this.duplicatesDetectedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'duplicatesDetectedAt'] = null;
    }
    if (this.facesRecognizedAt != null) {
      json[r'facesRecognizedAt'] = this.facesRecognizedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'facesRecognizedAt'] = null;
    }
    if (this.metadataExtractedAt != null) {
      json[r'metadataExtractedAt'] = this.metadataExtractedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'metadataExtractedAt'] = null;
    }
    if (this.previewAt != null) {
      json[r'previewAt'] = this.previewAt!.toUtc().toIso8601String();
    } else {
    //  json[r'previewAt'] = null;
    }
    if (this.thumbnailAt != null) {
      json[r'thumbnailAt'] = this.thumbnailAt!.toUtc().toIso8601String();
    } else {
    //  json[r'thumbnailAt'] = null;
    }
    return json;
  }

  /// Returns a new [AssetJobStatusEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetJobStatusEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetJobStatusEntity(
        asset: AssetEntity.fromJson(json[r'asset'])!,
        assetId: mapValueOfType<String>(json, r'assetId')!,
        duplicatesDetectedAt: mapDateTime(json, r'duplicatesDetectedAt', r''),
        facesRecognizedAt: mapDateTime(json, r'facesRecognizedAt', r''),
        metadataExtractedAt: mapDateTime(json, r'metadataExtractedAt', r''),
        previewAt: mapDateTime(json, r'previewAt', r''),
        thumbnailAt: mapDateTime(json, r'thumbnailAt', r''),
      );
    }
    return null;
  }

  static List<AssetJobStatusEntity> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetJobStatusEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetJobStatusEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetJobStatusEntity> mapFromJson(dynamic json) {
    final map = <String, AssetJobStatusEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetJobStatusEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetJobStatusEntity-objects as value to a dart map
  static Map<String, List<AssetJobStatusEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetJobStatusEntity>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetJobStatusEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'asset',
    'assetId',
    'duplicatesDetectedAt',
    'facesRecognizedAt',
    'metadataExtractedAt',
    'previewAt',
    'thumbnailAt',
  };
}

