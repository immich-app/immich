//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetEntity {
  /// Returns a new [AssetEntity] instance.
  AssetEntity({
    this.albums = const [],
    required this.checksum,
    required this.createdAt,
    required this.deletedAt,
    required this.deviceAssetId,
    required this.deviceId,
    required this.duplicateId,
    required this.duration,
    required this.encodedVideoPath,
    this.exifInfo,
    this.faces = const [],
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.id,
    required this.isArchived,
    required this.isExternal,
    required this.isFavorite,
    required this.isOffline,
    required this.isVisible,
    this.jobStatus,
    this.library_,
    this.libraryId,
    required this.livePhotoVideo,
    required this.livePhotoVideoId,
    required this.localDateTime,
    required this.originalFileName,
    required this.originalPath,
    required this.owner,
    required this.ownerId,
    required this.previewPath,
    this.sharedLinks = const [],
    required this.sidecarPath,
    this.smartInfo,
    this.smartSearch,
    this.stack,
    this.stackId,
    this.tags = const [],
    required this.thumbhash,
    required this.thumbnailPath,
    required this.type,
    required this.updatedAt,
  });

  List<AlbumEntity> albums;

  Object checksum;

  DateTime createdAt;

  DateTime? deletedAt;

  String deviceAssetId;

  String deviceId;

  String? duplicateId;

  String? duration;

  String? encodedVideoPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  ExifEntity? exifInfo;

  List<AssetFaceEntity> faces;

  DateTime fileCreatedAt;

  DateTime fileModifiedAt;

  String id;

  bool isArchived;

  bool isExternal;

  bool isFavorite;

  bool isOffline;

  bool isVisible;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetJobStatusEntity? jobStatus;

  LibraryEntity? library_;

  String? libraryId;

  AssetEntity? livePhotoVideo;

  String? livePhotoVideoId;

  DateTime localDateTime;

  String originalFileName;

  String originalPath;

  UserEntity owner;

  String ownerId;

  String? previewPath;

  List<SharedLinkEntity> sharedLinks;

  String? sidecarPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SmartInfoEntity? smartInfo;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SmartSearchEntity? smartSearch;

  StackEntity? stack;

  String? stackId;

  List<TagEntity> tags;

  Object? thumbhash;

  String? thumbnailPath;

  AssetEntityTypeEnum type;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEntity &&
    _deepEquality.equals(other.albums, albums) &&
    other.checksum == checksum &&
    other.createdAt == createdAt &&
    other.deletedAt == deletedAt &&
    other.deviceAssetId == deviceAssetId &&
    other.deviceId == deviceId &&
    other.duplicateId == duplicateId &&
    other.duration == duration &&
    other.encodedVideoPath == encodedVideoPath &&
    other.exifInfo == exifInfo &&
    _deepEquality.equals(other.faces, faces) &&
    other.fileCreatedAt == fileCreatedAt &&
    other.fileModifiedAt == fileModifiedAt &&
    other.id == id &&
    other.isArchived == isArchived &&
    other.isExternal == isExternal &&
    other.isFavorite == isFavorite &&
    other.isOffline == isOffline &&
    other.isVisible == isVisible &&
    other.jobStatus == jobStatus &&
    other.library_ == library_ &&
    other.libraryId == libraryId &&
    other.livePhotoVideo == livePhotoVideo &&
    other.livePhotoVideoId == livePhotoVideoId &&
    other.localDateTime == localDateTime &&
    other.originalFileName == originalFileName &&
    other.originalPath == originalPath &&
    other.owner == owner &&
    other.ownerId == ownerId &&
    other.previewPath == previewPath &&
    _deepEquality.equals(other.sharedLinks, sharedLinks) &&
    other.sidecarPath == sidecarPath &&
    other.smartInfo == smartInfo &&
    other.smartSearch == smartSearch &&
    other.stack == stack &&
    other.stackId == stackId &&
    _deepEquality.equals(other.tags, tags) &&
    other.thumbhash == thumbhash &&
    other.thumbnailPath == thumbnailPath &&
    other.type == type &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albums.hashCode) +
    (checksum.hashCode) +
    (createdAt.hashCode) +
    (deletedAt == null ? 0 : deletedAt!.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (duration == null ? 0 : duration!.hashCode) +
    (encodedVideoPath == null ? 0 : encodedVideoPath!.hashCode) +
    (exifInfo == null ? 0 : exifInfo!.hashCode) +
    (faces.hashCode) +
    (fileCreatedAt.hashCode) +
    (fileModifiedAt.hashCode) +
    (id.hashCode) +
    (isArchived.hashCode) +
    (isExternal.hashCode) +
    (isFavorite.hashCode) +
    (isOffline.hashCode) +
    (isVisible.hashCode) +
    (jobStatus == null ? 0 : jobStatus!.hashCode) +
    (library_ == null ? 0 : library_!.hashCode) +
    (libraryId == null ? 0 : libraryId!.hashCode) +
    (livePhotoVideo == null ? 0 : livePhotoVideo!.hashCode) +
    (livePhotoVideoId == null ? 0 : livePhotoVideoId!.hashCode) +
    (localDateTime.hashCode) +
    (originalFileName.hashCode) +
    (originalPath.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (previewPath == null ? 0 : previewPath!.hashCode) +
    (sharedLinks.hashCode) +
    (sidecarPath == null ? 0 : sidecarPath!.hashCode) +
    (smartInfo == null ? 0 : smartInfo!.hashCode) +
    (smartSearch == null ? 0 : smartSearch!.hashCode) +
    (stack == null ? 0 : stack!.hashCode) +
    (stackId == null ? 0 : stackId!.hashCode) +
    (tags.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (thumbnailPath == null ? 0 : thumbnailPath!.hashCode) +
    (type.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AssetEntity[albums=$albums, checksum=$checksum, createdAt=$createdAt, deletedAt=$deletedAt, deviceAssetId=$deviceAssetId, deviceId=$deviceId, duplicateId=$duplicateId, duration=$duration, encodedVideoPath=$encodedVideoPath, exifInfo=$exifInfo, faces=$faces, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, id=$id, isArchived=$isArchived, isExternal=$isExternal, isFavorite=$isFavorite, isOffline=$isOffline, isVisible=$isVisible, jobStatus=$jobStatus, library_=$library_, libraryId=$libraryId, livePhotoVideo=$livePhotoVideo, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, originalFileName=$originalFileName, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, previewPath=$previewPath, sharedLinks=$sharedLinks, sidecarPath=$sidecarPath, smartInfo=$smartInfo, smartSearch=$smartSearch, stack=$stack, stackId=$stackId, tags=$tags, thumbhash=$thumbhash, thumbnailPath=$thumbnailPath, type=$type, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albums'] = this.albums;
      json[r'checksum'] = this.checksum;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.deletedAt != null) {
      json[r'deletedAt'] = this.deletedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'deletedAt'] = null;
    }
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
    if (this.duplicateId != null) {
      json[r'duplicateId'] = this.duplicateId;
    } else {
    //  json[r'duplicateId'] = null;
    }
    if (this.duration != null) {
      json[r'duration'] = this.duration;
    } else {
    //  json[r'duration'] = null;
    }
    if (this.encodedVideoPath != null) {
      json[r'encodedVideoPath'] = this.encodedVideoPath;
    } else {
    //  json[r'encodedVideoPath'] = null;
    }
    if (this.exifInfo != null) {
      json[r'exifInfo'] = this.exifInfo;
    } else {
    //  json[r'exifInfo'] = null;
    }
      json[r'faces'] = this.faces;
      json[r'fileCreatedAt'] = this.fileCreatedAt.toUtc().toIso8601String();
      json[r'fileModifiedAt'] = this.fileModifiedAt.toUtc().toIso8601String();
      json[r'id'] = this.id;
      json[r'isArchived'] = this.isArchived;
      json[r'isExternal'] = this.isExternal;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isOffline'] = this.isOffline;
      json[r'isVisible'] = this.isVisible;
    if (this.jobStatus != null) {
      json[r'jobStatus'] = this.jobStatus;
    } else {
    //  json[r'jobStatus'] = null;
    }
    if (this.library_ != null) {
      json[r'library'] = this.library_;
    } else {
    //  json[r'library'] = null;
    }
    if (this.libraryId != null) {
      json[r'libraryId'] = this.libraryId;
    } else {
    //  json[r'libraryId'] = null;
    }
    if (this.livePhotoVideo != null) {
      json[r'livePhotoVideo'] = this.livePhotoVideo;
    } else {
    //  json[r'livePhotoVideo'] = null;
    }
    if (this.livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = this.livePhotoVideoId;
    } else {
    //  json[r'livePhotoVideoId'] = null;
    }
      json[r'localDateTime'] = this.localDateTime.toUtc().toIso8601String();
      json[r'originalFileName'] = this.originalFileName;
      json[r'originalPath'] = this.originalPath;
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
    if (this.previewPath != null) {
      json[r'previewPath'] = this.previewPath;
    } else {
    //  json[r'previewPath'] = null;
    }
      json[r'sharedLinks'] = this.sharedLinks;
    if (this.sidecarPath != null) {
      json[r'sidecarPath'] = this.sidecarPath;
    } else {
    //  json[r'sidecarPath'] = null;
    }
    if (this.smartInfo != null) {
      json[r'smartInfo'] = this.smartInfo;
    } else {
    //  json[r'smartInfo'] = null;
    }
    if (this.smartSearch != null) {
      json[r'smartSearch'] = this.smartSearch;
    } else {
    //  json[r'smartSearch'] = null;
    }
    if (this.stack != null) {
      json[r'stack'] = this.stack;
    } else {
    //  json[r'stack'] = null;
    }
    if (this.stackId != null) {
      json[r'stackId'] = this.stackId;
    } else {
    //  json[r'stackId'] = null;
    }
      json[r'tags'] = this.tags;
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
    //  json[r'thumbhash'] = null;
    }
    if (this.thumbnailPath != null) {
      json[r'thumbnailPath'] = this.thumbnailPath;
    } else {
    //  json[r'thumbnailPath'] = null;
    }
      json[r'type'] = this.type;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [AssetEntity] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetEntity? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetEntity(
        albums: AlbumEntity.listFromJson(json[r'albums']),
        checksum: mapValueOfType<Object>(json, r'checksum')!,
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        deletedAt: mapDateTime(json, r'deletedAt', r''),
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        duplicateId: mapValueOfType<String>(json, r'duplicateId'),
        duration: mapValueOfType<String>(json, r'duration'),
        encodedVideoPath: mapValueOfType<String>(json, r'encodedVideoPath'),
        exifInfo: ExifEntity.fromJson(json[r'exifInfo']),
        faces: AssetFaceEntity.listFromJson(json[r'faces']),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r'')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', r'')!,
        id: mapValueOfType<String>(json, r'id')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived')!,
        isExternal: mapValueOfType<bool>(json, r'isExternal')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isOffline: mapValueOfType<bool>(json, r'isOffline')!,
        isVisible: mapValueOfType<bool>(json, r'isVisible')!,
        jobStatus: AssetJobStatusEntity.fromJson(json[r'jobStatus']),
        library_: LibraryEntity.fromJson(json[r'library']),
        libraryId: mapValueOfType<String>(json, r'libraryId'),
        livePhotoVideo: AssetEntity.fromJson(json[r'livePhotoVideo']),
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        localDateTime: mapDateTime(json, r'localDateTime', r'')!,
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        owner: UserEntity.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        previewPath: mapValueOfType<String>(json, r'previewPath'),
        sharedLinks: SharedLinkEntity.listFromJson(json[r'sharedLinks']),
        sidecarPath: mapValueOfType<String>(json, r'sidecarPath'),
        smartInfo: SmartInfoEntity.fromJson(json[r'smartInfo']),
        smartSearch: SmartSearchEntity.fromJson(json[r'smartSearch']),
        stack: StackEntity.fromJson(json[r'stack']),
        stackId: mapValueOfType<String>(json, r'stackId'),
        tags: TagEntity.listFromJson(json[r'tags']),
        thumbhash: mapValueOfType<Object>(json, r'thumbhash'),
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath'),
        type: AssetEntityTypeEnum.fromJson(json[r'type'])!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<AssetEntity> listFromJson(dynamic json, {bool growable = false,}) {
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
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetEntity.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'checksum',
    'createdAt',
    'deletedAt',
    'deviceAssetId',
    'deviceId',
    'duplicateId',
    'duration',
    'encodedVideoPath',
    'faces',
    'fileCreatedAt',
    'fileModifiedAt',
    'id',
    'isArchived',
    'isExternal',
    'isFavorite',
    'isOffline',
    'isVisible',
    'livePhotoVideo',
    'livePhotoVideoId',
    'localDateTime',
    'originalFileName',
    'originalPath',
    'owner',
    'ownerId',
    'previewPath',
    'sharedLinks',
    'sidecarPath',
    'tags',
    'thumbhash',
    'thumbnailPath',
    'type',
    'updatedAt',
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

  static List<AssetEntityTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
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
      switch (data) {
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


