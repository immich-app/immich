//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SyncAssetV1 {
  /// Returns a new [SyncAssetV1] instance.
  SyncAssetV1({
    required this.checksum,
    required this.deletedAt,
    required this.duration,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.id,
    required this.isFavorite,
    required this.localDateTime,
    required this.originalFileName,
    required this.ownerId,
    required this.thumbhash,
    required this.type,
    required this.visibility,
  });

  String checksum;

  DateTime? deletedAt;

  String? duration;

  DateTime? fileCreatedAt;

  DateTime? fileModifiedAt;

  String id;

  bool isFavorite;

  DateTime? localDateTime;

  String originalFileName;

  String ownerId;

  String? thumbhash;

  AssetTypeEnum type;

  AssetVisibility visibility;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SyncAssetV1 &&
    other.checksum == checksum &&
    other.deletedAt == deletedAt &&
    other.duration == duration &&
    other.fileCreatedAt == fileCreatedAt &&
    other.fileModifiedAt == fileModifiedAt &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.localDateTime == localDateTime &&
    other.originalFileName == originalFileName &&
    other.ownerId == ownerId &&
    other.thumbhash == thumbhash &&
    other.type == type &&
    other.visibility == visibility;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (duration == null ? 0 : duration!.hashCode) +
    (fileCreatedAt == null ? 0 : fileCreatedAt!.hashCode) +
    (fileModifiedAt == null ? 0 : fileModifiedAt!.hashCode) +
    (id.hashCode) +
    (isFavorite.hashCode) +
    (localDateTime == null ? 0 : localDateTime!.hashCode) +
    (originalFileName.hashCode) +
    (ownerId.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode) +
    (visibility.hashCode);

  @override
  String toString() => 'SyncAssetV1[checksum=$checksum, deletedAt=$deletedAt, duration=$duration, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, id=$id, isFavorite=$isFavorite, localDateTime=$localDateTime, originalFileName=$originalFileName, ownerId=$ownerId, thumbhash=$thumbhash, type=$type, visibility=$visibility]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
    if (this.duration != null) {
      json[r'duration'] = this.duration;
    } else {
    //  json[r'duration'] = null;
    }
    if (this.fileCreatedAt != null) {
      json[r'fileCreatedAt'] = this.fileCreatedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'fileCreatedAt'] = null;
    }
    if (this.fileModifiedAt != null) {
      json[r'fileModifiedAt'] = this.fileModifiedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'fileModifiedAt'] = null;
    }
      json[r'id'] = this.id;
      json[r'isFavorite'] = this.isFavorite;
    if (this.localDateTime != null) {
      json[r'localDateTime'] = this.localDateTime!.toUtc().toIso8601String();
    } else {
    //  json[r'localDateTime'] = null;
    }
      json[r'originalFileName'] = this.originalFileName;
      json[r'ownerId'] = this.ownerId;
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
    //  json[r'thumbhash'] = null;
    }
      json[r'type'] = this.type;
      json[r'visibility'] = this.visibility;
    return json;
  }

  /// Returns a new [SyncAssetV1] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SyncAssetV1? fromJson(dynamic value) {
    upgradeDto(value, "SyncAssetV1");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SyncAssetV1(
        checksum: mapValueOfType<String>(json, r'checksum')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        duration: mapValueOfType<String>(json, r'duration'),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r''),
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', r''),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        localDateTime: mapDateTime(json, r'localDateTime', r''),
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        thumbhash: mapValueOfType<String>(json, r'thumbhash'),
        type: AssetTypeEnum.fromJson(json[r'type'])!,
        visibility: AssetVisibility.fromJson(json[r'visibility'])!,
      );
    }
    return null;
  }

  static List<SyncAssetV1> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SyncAssetV1>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SyncAssetV1.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SyncAssetV1> mapFromJson(dynamic json) {
    final map = <String, SyncAssetV1>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SyncAssetV1.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SyncAssetV1-objects as value to a dart map
  static Map<String, List<SyncAssetV1>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SyncAssetV1>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SyncAssetV1.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksum',
    'deletedAt',
    'duration',
    'fileCreatedAt',
    'fileModifiedAt',
    'id',
    'isFavorite',
    'localDateTime',
    'originalFileName',
    'ownerId',
    'thumbhash',
    'type',
    'visibility',
  };
}

