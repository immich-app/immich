//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEntity {
  /// Returns a new [AssetEntity] instance.
  AssetEntity({
    required this.id,
    required this.deviceAssetId,
    required this.userId,
    required this.deviceId,
    required this.type,
    required this.originalPath,
    required this.resizePath,
    required this.webpPath,
    required this.encodedVideoPath,
    required this.createdAt,
    required this.modifiedAt,
    required this.isFavorite,
    required this.mimeType,
    this.checksum,
    required this.duration,
    required this.isVisible,
    required this.livePhotoVideoId,
    this.exifInfo,
    this.smartInfo,
    this.tags = const [],
  });

  String id;

  String deviceAssetId;

  String userId;

  String deviceId;

  AssetEntityTypeEnum type;

  String originalPath;

  String? resizePath;

  String? webpPath;

  String encodedVideoPath;

  String createdAt;

  String modifiedAt;

  bool isFavorite;

  String? mimeType;

  Object? checksum;

  String? duration;

  bool isVisible;

  String? livePhotoVideoId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  ExifEntity? exifInfo;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SmartInfoEntity? smartInfo;

  List<TagEntity> tags;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEntity &&
     other.id == id &&
     other.deviceAssetId == deviceAssetId &&
     other.userId == userId &&
     other.deviceId == deviceId &&
     other.type == type &&
     other.originalPath == originalPath &&
     other.resizePath == resizePath &&
     other.webpPath == webpPath &&
     other.encodedVideoPath == encodedVideoPath &&
     other.createdAt == createdAt &&
     other.modifiedAt == modifiedAt &&
     other.isFavorite == isFavorite &&
     other.mimeType == mimeType &&
     other.checksum == checksum &&
     other.duration == duration &&
     other.isVisible == isVisible &&
     other.livePhotoVideoId == livePhotoVideoId &&
     other.exifInfo == exifInfo &&
     other.smartInfo == smartInfo &&
     other.tags == tags;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (deviceAssetId.hashCode) +
    (userId.hashCode) +
    (deviceId.hashCode) +
    (type.hashCode) +
    (originalPath.hashCode) +
    (resizePath == null ? 0 : resizePath!.hashCode) +
    (webpPath == null ? 0 : webpPath!.hashCode) +
    (encodedVideoPath.hashCode) +
    (createdAt.hashCode) +
    (modifiedAt.hashCode) +
    (isFavorite.hashCode) +
    (mimeType == null ? 0 : mimeType!.hashCode) +
    (checksum == null ? 0 : checksum!.hashCode) +
    (duration == null ? 0 : duration!.hashCode) +
    (isVisible.hashCode) +
    (livePhotoVideoId == null ? 0 : livePhotoVideoId!.hashCode) +
    (exifInfo == null ? 0 : exifInfo!.hashCode) +
    (smartInfo == null ? 0 : smartInfo!.hashCode) +
    (tags.hashCode);

  @override
  String toString() => 'AssetEntity[id=$id, deviceAssetId=$deviceAssetId, userId=$userId, deviceId=$deviceId, type=$type, originalPath=$originalPath, resizePath=$resizePath, webpPath=$webpPath, encodedVideoPath=$encodedVideoPath, createdAt=$createdAt, modifiedAt=$modifiedAt, isFavorite=$isFavorite, mimeType=$mimeType, checksum=$checksum, duration=$duration, isVisible=$isVisible, livePhotoVideoId=$livePhotoVideoId, exifInfo=$exifInfo, smartInfo=$smartInfo, tags=$tags]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'id'] = id;
      _json[r'deviceAssetId'] = deviceAssetId;
      _json[r'userId'] = userId;
      _json[r'deviceId'] = deviceId;
      _json[r'type'] = type;
      _json[r'originalPath'] = originalPath;
    if (resizePath != null) {
      _json[r'resizePath'] = resizePath;
    } else {
      _json[r'resizePath'] = null;
    }
    if (webpPath != null) {
      _json[r'webpPath'] = webpPath;
    } else {
      _json[r'webpPath'] = null;
    }
      _json[r'encodedVideoPath'] = encodedVideoPath;
      _json[r'createdAt'] = createdAt;
      _json[r'modifiedAt'] = modifiedAt;
      _json[r'isFavorite'] = isFavorite;
    if (mimeType != null) {
      _json[r'mimeType'] = mimeType;
    } else {
      _json[r'mimeType'] = null;
    }
    if (checksum != null) {
      _json[r'checksum'] = checksum;
    } else {
      _json[r'checksum'] = null;
    }
    if (duration != null) {
      _json[r'duration'] = duration;
    } else {
      _json[r'duration'] = null;
    }
      _json[r'isVisible'] = isVisible;
    if (livePhotoVideoId != null) {
      _json[r'livePhotoVideoId'] = livePhotoVideoId;
    } else {
      _json[r'livePhotoVideoId'] = null;
    }
    if (exifInfo != null) {
      _json[r'exifInfo'] = exifInfo;
    } else {
      _json[r'exifInfo'] = null;
    }
    if (smartInfo != null) {
      _json[r'smartInfo'] = smartInfo;
    } else {
      _json[r'smartInfo'] = null;
    }
      _json[r'tags'] = tags;
    return _json;
  }

  /// Returns a new [AssetEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AssetEntity[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AssetEntity[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AssetEntity(
        id: mapValueOfType<String>(json, r'id')!,
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        userId: mapValueOfType<String>(json, r'userId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        type: AssetEntityTypeEnum.fromJson(json[r'type'])!,
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        resizePath: mapValueOfType<String>(json, r'resizePath'),
        webpPath: mapValueOfType<String>(json, r'webpPath'),
        encodedVideoPath: mapValueOfType<String>(json, r'encodedVideoPath')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        modifiedAt: mapValueOfType<String>(json, r'modifiedAt')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        mimeType: mapValueOfType<String>(json, r'mimeType'),
        checksum: mapValueOfType<Object>(json, r'checksum'),
        duration: mapValueOfType<String>(json, r'duration'),
        isVisible: mapValueOfType<bool>(json, r'isVisible')!,
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        exifInfo: ExifEntity.fromJson(json[r'exifInfo']),
        smartInfo: SmartInfoEntity.fromJson(json[r'smartInfo']),
        tags: TagEntity.listFromJson(json[r'tags'])!,
      );
    }
    return null;
  }

  static List<AssetEntity>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEntity>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEntity.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetEntity> mapFromJson(dynamic json) {
    final map = <String, AssetEntity>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEntity.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetEntity-objects as value to a dart map
  static Map<String, List<AssetEntity>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetEntity>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetEntity.listFromJson(entry.value, growable: growable,);
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
    'deviceAssetId',
    'userId',
    'deviceId',
    'type',
    'originalPath',
    'resizePath',
    'webpPath',
    'encodedVideoPath',
    'createdAt',
    'modifiedAt',
    'isFavorite',
    'mimeType',
    'duration',
    'isVisible',
    'livePhotoVideoId',
    'tags',
  };
}


class AssetEntityTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const AssetEntityTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const IMAGE = AssetEntityTypeEnum._(r'IMAGE');
  static const VIDEO = AssetEntityTypeEnum._(r'VIDEO');
  static const AUDIO = AssetEntityTypeEnum._(r'AUDIO');
  static const OTHER = AssetEntityTypeEnum._(r'OTHER');

  /// List of all possible values in this [enum][AssetEntityTypeEnum].
  static const values = <AssetEntityTypeEnum>[
    IMAGE,
    VIDEO,
    AUDIO,
    OTHER,
  ];

  static AssetEntityTypeEnum? fromJson(dynamic value) => AssetEntityTypeEnumTypeTransformer().decode(value);

  static List<AssetEntityTypeEnum>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetEntityTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetEntityTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetEntityTypeEnum] to String,
/// and [decode] dynamic data back to [AssetEntityTypeEnum].
class AssetEntityTypeEnumTypeTransformer {
  factory AssetEntityTypeEnumTypeTransformer() => _instance ??= const AssetEntityTypeEnumTypeTransformer._();

  const AssetEntityTypeEnumTypeTransformer._();

  String encode(AssetEntityTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetEntityTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetEntityTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data.toString()) {
        case r'IMAGE': return AssetEntityTypeEnum.IMAGE;
        case r'VIDEO': return AssetEntityTypeEnum.VIDEO;
        case r'AUDIO': return AssetEntityTypeEnum.AUDIO;
        case r'OTHER': return AssetEntityTypeEnum.OTHER;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetEntityTypeEnumTypeTransformer] instance.
  static AssetEntityTypeEnumTypeTransformer? _instance;
}


