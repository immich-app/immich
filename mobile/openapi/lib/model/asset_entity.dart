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
    this.albums = const [],
    required this.checksum,
    required this.createdAt,
    required this.deviceAssetId,
    required this.deviceId,
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
    required this.isReadOnly,
    required this.isVisible,
    required this.library_,
    required this.libraryId,
    required this.livePhotoVideo,
    required this.livePhotoVideoId,
    required this.originalFileName,
    required this.originalPath,
    required this.owner,
    required this.ownerId,
    required this.resizePath,
    this.sharedLinks = const [],
    required this.sidecarPath,
    this.smartInfo,
    this.tags = const [],
    required this.thumbhash,
    required this.type,
    required this.updatedAt,
    required this.webpPath,
  });

  List<AlbumEntity> albums;

  Object checksum;

  DateTime createdAt;

  String deviceAssetId;

  String deviceId;

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

  bool isReadOnly;

  bool isVisible;

  LibraryEntity library_;

  String libraryId;

  AssetEntity? livePhotoVideo;

  String? livePhotoVideoId;

  String originalFileName;

  String originalPath;

  UserEntity owner;

  String ownerId;

  String? resizePath;

  List<SharedLinkEntity> sharedLinks;

  String? sidecarPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SmartInfoEntity? smartInfo;

  List<TagEntity> tags;

  Object? thumbhash;

  AssetEntityTypeEnum type;

  DateTime updatedAt;

  String? webpPath;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetEntity &&
     other.albums == albums &&
     other.checksum == checksum &&
     other.createdAt == createdAt &&
     other.deviceAssetId == deviceAssetId &&
     other.deviceId == deviceId &&
     other.duration == duration &&
     other.encodedVideoPath == encodedVideoPath &&
     other.exifInfo == exifInfo &&
     other.faces == faces &&
     other.fileCreatedAt == fileCreatedAt &&
     other.fileModifiedAt == fileModifiedAt &&
     other.id == id &&
     other.isArchived == isArchived &&
     other.isExternal == isExternal &&
     other.isFavorite == isFavorite &&
     other.isOffline == isOffline &&
     other.isReadOnly == isReadOnly &&
     other.isVisible == isVisible &&
     other.library_ == library_ &&
     other.libraryId == libraryId &&
     other.livePhotoVideo == livePhotoVideo &&
     other.livePhotoVideoId == livePhotoVideoId &&
     other.originalFileName == originalFileName &&
     other.originalPath == originalPath &&
     other.owner == owner &&
     other.ownerId == ownerId &&
     other.resizePath == resizePath &&
     other.sharedLinks == sharedLinks &&
     other.sidecarPath == sidecarPath &&
     other.smartInfo == smartInfo &&
     other.tags == tags &&
     other.thumbhash == thumbhash &&
     other.type == type &&
     other.updatedAt == updatedAt &&
     other.webpPath == webpPath;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albums.hashCode) +
    (checksum.hashCode) +
    (createdAt.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
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
    (isReadOnly.hashCode) +
    (isVisible.hashCode) +
    (library_.hashCode) +
    (libraryId.hashCode) +
    (livePhotoVideo == null ? 0 : livePhotoVideo!.hashCode) +
    (livePhotoVideoId == null ? 0 : livePhotoVideoId!.hashCode) +
    (originalFileName.hashCode) +
    (originalPath.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (resizePath == null ? 0 : resizePath!.hashCode) +
    (sharedLinks.hashCode) +
    (sidecarPath == null ? 0 : sidecarPath!.hashCode) +
    (smartInfo == null ? 0 : smartInfo!.hashCode) +
    (tags.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode) +
    (updatedAt.hashCode) +
    (webpPath == null ? 0 : webpPath!.hashCode);

  @override
  String toString() => 'AssetEntity[albums=$albums, checksum=$checksum, createdAt=$createdAt, deviceAssetId=$deviceAssetId, deviceId=$deviceId, duration=$duration, encodedVideoPath=$encodedVideoPath, exifInfo=$exifInfo, faces=$faces, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, id=$id, isArchived=$isArchived, isExternal=$isExternal, isFavorite=$isFavorite, isOffline=$isOffline, isReadOnly=$isReadOnly, isVisible=$isVisible, library_=$library_, libraryId=$libraryId, livePhotoVideo=$livePhotoVideo, livePhotoVideoId=$livePhotoVideoId, originalFileName=$originalFileName, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, resizePath=$resizePath, sharedLinks=$sharedLinks, sidecarPath=$sidecarPath, smartInfo=$smartInfo, tags=$tags, thumbhash=$thumbhash, type=$type, updatedAt=$updatedAt, webpPath=$webpPath]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albums'] = this.albums;
      json[r'checksum'] = this.checksum;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
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
      json[r'isReadOnly'] = this.isReadOnly;
      json[r'isVisible'] = this.isVisible;
      json[r'library'] = this.library_;
      json[r'libraryId'] = this.libraryId;
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
      json[r'originalFileName'] = this.originalFileName;
      json[r'originalPath'] = this.originalPath;
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
    if (this.resizePath != null) {
      json[r'resizePath'] = this.resizePath;
    } else {
    //  json[r'resizePath'] = null;
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
      json[r'tags'] = this.tags;
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
    //  json[r'thumbhash'] = null;
    }
      json[r'type'] = this.type;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    if (this.webpPath != null) {
      json[r'webpPath'] = this.webpPath;
    } else {
    //  json[r'webpPath'] = null;
    }
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
        createdAt: mapDateTime(json, r'createdAt', '')!,
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        duration: mapValueOfType<String>(json, r'duration'),
        encodedVideoPath: mapValueOfType<String>(json, r'encodedVideoPath'),
        exifInfo: ExifEntity.fromJson(json[r'exifInfo']),
        faces: AssetFaceEntity.listFromJson(json[r'faces']),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', '')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', '')!,
        id: mapValueOfType<String>(json, r'id')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived')!,
        isExternal: mapValueOfType<bool>(json, r'isExternal')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isOffline: mapValueOfType<bool>(json, r'isOffline')!,
        isReadOnly: mapValueOfType<bool>(json, r'isReadOnly')!,
        isVisible: mapValueOfType<bool>(json, r'isVisible')!,
        library_: LibraryEntity.fromJson(json[r'library'])!,
        libraryId: mapValueOfType<String>(json, r'libraryId')!,
        livePhotoVideo: AssetEntity.fromJson(json[r'livePhotoVideo']),
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        owner: UserEntity.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        resizePath: mapValueOfType<String>(json, r'resizePath'),
        sharedLinks: SharedLinkEntity.listFromJson(json[r'sharedLinks']),
        sidecarPath: mapValueOfType<String>(json, r'sidecarPath'),
        smartInfo: SmartInfoEntity.fromJson(json[r'smartInfo']),
        tags: TagEntity.listFromJson(json[r'tags']),
        thumbhash: mapValueOfType<Object>(json, r'thumbhash'),
        type: AssetEntityTypeEnum.fromJson(json[r'type'])!,
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
        webpPath: mapValueOfType<String>(json, r'webpPath'),
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
    'deviceAssetId',
    'deviceId',
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
    'isReadOnly',
    'isVisible',
    'library',
    'libraryId',
    'livePhotoVideo',
    'livePhotoVideoId',
    'originalFileName',
    'originalPath',
    'owner',
    'ownerId',
    'resizePath',
    'sharedLinks',
    'sidecarPath',
    'tags',
    'thumbhash',
    'type',
    'updatedAt',
    'webpPath',
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


