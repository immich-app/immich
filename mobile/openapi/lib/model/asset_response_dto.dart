//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetResponseDto {
  /// Returns a new [AssetResponseDto] instance.
  AssetResponseDto({
    required this.checksum,
    required this.createdAt,
    required this.deviceAssetId,
    required this.deviceId,
    this.duplicateId,
    required this.duration,
    this.exifInfo,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.hasMetadata,
    required this.height,
    required this.id,
    required this.isArchived,
    required this.isEdited,
    required this.isFavorite,
    required this.isOffline,
    required this.isTrashed,
    this.libraryId,
    this.livePhotoVideoId,
    required this.localDateTime,
    required this.originalFileName,
    this.originalMimeType,
    required this.originalPath,
    this.owner,
    required this.ownerId,
    this.people = const [],
    this.resized,
    this.stack,
    this.tags = const [],
    required this.thumbhash,
    required this.type,
    this.unassignedFaces = const [],
    required this.updatedAt,
    required this.visibility,
    required this.width,
  });

  /// Base64 encoded SHA1 hash
  String checksum;

  /// The UTC timestamp when the asset was originally uploaded to Immich.
  DateTime createdAt;

  /// Device asset ID
  String deviceAssetId;

  /// Device ID
  String deviceId;

  String? duplicateId;

  /// Video duration (for videos)
  String duration;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  ExifResponseDto? exifInfo;

  /// The actual UTC timestamp when the file was created/captured, preserving timezone information. This is the authoritative timestamp for chronological sorting within timeline groups. Combined with timezone data, this can be used to determine the exact moment the photo was taken.
  DateTime fileCreatedAt;

  /// The UTC timestamp when the file was last modified on the filesystem. This reflects the last time the physical file was changed, which may be different from when the photo was originally taken.
  DateTime fileModifiedAt;

  /// Whether asset has metadata
  bool hasMetadata;

  /// Asset height
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int? height;

  /// Asset ID
  String id;

  /// Is archived
  bool isArchived;

  /// Is edited
  bool isEdited;

  /// Is favorite
  bool isFavorite;

  /// Is offline
  bool isOffline;

  /// Is trashed
  bool isTrashed;

  String? libraryId;

  String? livePhotoVideoId;

  /// The local date and time when the photo/video was taken, derived from EXIF metadata. This represents the photographer's local time regardless of timezone, stored as a timezone-agnostic timestamp. Used for timeline grouping by \"local\" days and months.
  DateTime localDateTime;

  /// Original file name
  String originalFileName;

  /// Original MIME type
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? originalMimeType;

  /// Original file path
  String originalPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  UserResponseDto? owner;

  /// Owner user ID
  String ownerId;

  List<PersonWithFacesResponseDto> people;

  /// Is resized
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? resized;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetStackResponseDto? stack;

  List<TagResponseDto> tags;

  /// Thumbhash for thumbnail generation
  String? thumbhash;

  /// Asset type
  AssetResponseDtoTypeEnum type;

  List<AssetFaceWithoutPersonResponseDto> unassignedFaces;

  /// The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified.
  DateTime updatedAt;

  /// Asset visibility
  AssetResponseDtoVisibilityEnum visibility;

  /// Asset width
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int? width;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetResponseDto &&
    other.checksum == checksum &&
    other.createdAt == createdAt &&
    other.deviceAssetId == deviceAssetId &&
    other.deviceId == deviceId &&
    other.duplicateId == duplicateId &&
    other.duration == duration &&
    other.exifInfo == exifInfo &&
    other.fileCreatedAt == fileCreatedAt &&
    other.fileModifiedAt == fileModifiedAt &&
    other.hasMetadata == hasMetadata &&
    other.height == height &&
    other.id == id &&
    other.isArchived == isArchived &&
    other.isEdited == isEdited &&
    other.isFavorite == isFavorite &&
    other.isOffline == isOffline &&
    other.isTrashed == isTrashed &&
    other.libraryId == libraryId &&
    other.livePhotoVideoId == livePhotoVideoId &&
    other.localDateTime == localDateTime &&
    other.originalFileName == originalFileName &&
    other.originalMimeType == originalMimeType &&
    other.originalPath == originalPath &&
    other.owner == owner &&
    other.ownerId == ownerId &&
    _deepEquality.equals(other.people, people) &&
    other.resized == resized &&
    other.stack == stack &&
    _deepEquality.equals(other.tags, tags) &&
    other.thumbhash == thumbhash &&
    other.type == type &&
    _deepEquality.equals(other.unassignedFaces, unassignedFaces) &&
    other.updatedAt == updatedAt &&
    other.visibility == visibility &&
    other.width == width;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (createdAt.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (duration.hashCode) +
    (exifInfo == null ? 0 : exifInfo!.hashCode) +
    (fileCreatedAt.hashCode) +
    (fileModifiedAt.hashCode) +
    (hasMetadata.hashCode) +
    (height == null ? 0 : height!.hashCode) +
    (id.hashCode) +
    (isArchived.hashCode) +
    (isEdited.hashCode) +
    (isFavorite.hashCode) +
    (isOffline.hashCode) +
    (isTrashed.hashCode) +
    (libraryId == null ? 0 : libraryId!.hashCode) +
    (livePhotoVideoId == null ? 0 : livePhotoVideoId!.hashCode) +
    (localDateTime.hashCode) +
    (originalFileName.hashCode) +
    (originalMimeType == null ? 0 : originalMimeType!.hashCode) +
    (originalPath.hashCode) +
    (owner == null ? 0 : owner!.hashCode) +
    (ownerId.hashCode) +
    (people.hashCode) +
    (resized == null ? 0 : resized!.hashCode) +
    (stack == null ? 0 : stack!.hashCode) +
    (tags.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode) +
    (unassignedFaces.hashCode) +
    (updatedAt.hashCode) +
    (visibility.hashCode) +
    (width == null ? 0 : width!.hashCode);

  @override
  String toString() => 'AssetResponseDto[checksum=$checksum, createdAt=$createdAt, deviceAssetId=$deviceAssetId, deviceId=$deviceId, duplicateId=$duplicateId, duration=$duration, exifInfo=$exifInfo, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, hasMetadata=$hasMetadata, height=$height, id=$id, isArchived=$isArchived, isEdited=$isEdited, isFavorite=$isFavorite, isOffline=$isOffline, isTrashed=$isTrashed, libraryId=$libraryId, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, originalFileName=$originalFileName, originalMimeType=$originalMimeType, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, people=$people, resized=$resized, stack=$stack, tags=$tags, thumbhash=$thumbhash, type=$type, unassignedFaces=$unassignedFaces, updatedAt=$updatedAt, visibility=$visibility, width=$width]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
      json[r'createdAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.createdAt.millisecondsSinceEpoch
        : this.createdAt.toUtc().toIso8601String();
      json[r'deviceAssetId'] = this.deviceAssetId;
      json[r'deviceId'] = this.deviceId;
    if (this.duplicateId != null) {
      json[r'duplicateId'] = this.duplicateId;
    } else {
    //  json[r'duplicateId'] = null;
    }
      json[r'duration'] = this.duration;
    if (this.exifInfo != null) {
      json[r'exifInfo'] = this.exifInfo;
    } else {
    //  json[r'exifInfo'] = null;
    }
      json[r'fileCreatedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.fileCreatedAt.millisecondsSinceEpoch
        : this.fileCreatedAt.toUtc().toIso8601String();
      json[r'fileModifiedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.fileModifiedAt.millisecondsSinceEpoch
        : this.fileModifiedAt.toUtc().toIso8601String();
      json[r'hasMetadata'] = this.hasMetadata;
    if (this.height != null) {
      json[r'height'] = this.height;
    } else {
    //  json[r'height'] = null;
    }
      json[r'id'] = this.id;
      json[r'isArchived'] = this.isArchived;
      json[r'isEdited'] = this.isEdited;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isOffline'] = this.isOffline;
      json[r'isTrashed'] = this.isTrashed;
    if (this.libraryId != null) {
      json[r'libraryId'] = this.libraryId;
    } else {
    //  json[r'libraryId'] = null;
    }
    if (this.livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = this.livePhotoVideoId;
    } else {
    //  json[r'livePhotoVideoId'] = null;
    }
      json[r'localDateTime'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.localDateTime.millisecondsSinceEpoch
        : this.localDateTime.toUtc().toIso8601String();
      json[r'originalFileName'] = this.originalFileName;
    if (this.originalMimeType != null) {
      json[r'originalMimeType'] = this.originalMimeType;
    } else {
    //  json[r'originalMimeType'] = null;
    }
      json[r'originalPath'] = this.originalPath;
    if (this.owner != null) {
      json[r'owner'] = this.owner;
    } else {
    //  json[r'owner'] = null;
    }
      json[r'ownerId'] = this.ownerId;
      json[r'people'] = this.people;
    if (this.resized != null) {
      json[r'resized'] = this.resized;
    } else {
    //  json[r'resized'] = null;
    }
    if (this.stack != null) {
      json[r'stack'] = this.stack;
    } else {
    //  json[r'stack'] = null;
    }
      json[r'tags'] = this.tags;
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
    //  json[r'thumbhash'] = null;
    }
      json[r'type'] = this.type;
      json[r'unassignedFaces'] = this.unassignedFaces;
      json[r'updatedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.updatedAt.millisecondsSinceEpoch
        : this.updatedAt.toUtc().toIso8601String();
      json[r'visibility'] = this.visibility;
    if (this.width != null) {
      json[r'width'] = this.width;
    } else {
    //  json[r'width'] = null;
    }
    return json;
  }

  /// Returns a new [AssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetResponseDto(
        checksum: mapValueOfType<String>(json, r'checksum')!,
        createdAt: mapDateTime(json, r'createdAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        duplicateId: mapValueOfType<String>(json, r'duplicateId'),
        duration: mapValueOfType<String>(json, r'duration')!,
        exifInfo: ExifResponseDto.fromJson(json[r'exifInfo']),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        hasMetadata: mapValueOfType<bool>(json, r'hasMetadata')!,
        height: mapValueOfType<int>(json, r'height'),
        id: mapValueOfType<String>(json, r'id')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived')!,
        isEdited: mapValueOfType<bool>(json, r'isEdited')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isOffline: mapValueOfType<bool>(json, r'isOffline')!,
        isTrashed: mapValueOfType<bool>(json, r'isTrashed')!,
        libraryId: mapValueOfType<String>(json, r'libraryId'),
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        localDateTime: mapDateTime(json, r'localDateTime', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        originalMimeType: mapValueOfType<String>(json, r'originalMimeType'),
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        owner: UserResponseDto.fromJson(json[r'owner']),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        people: PersonWithFacesResponseDto.listFromJson(json[r'people']),
        resized: mapValueOfType<bool>(json, r'resized'),
        stack: AssetStackResponseDto.fromJson(json[r'stack']),
        tags: TagResponseDto.listFromJson(json[r'tags']),
        thumbhash: mapValueOfType<String>(json, r'thumbhash'),
        type: AssetResponseDtoTypeEnum.fromJson(json[r'type'])!,
        unassignedFaces: AssetFaceWithoutPersonResponseDto.listFromJson(json[r'unassignedFaces']),
        updatedAt: mapDateTime(json, r'updatedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        visibility: AssetResponseDtoVisibilityEnum.fromJson(json[r'visibility'])!,
        width: mapValueOfType<int>(json, r'width'),
      );
    }
    return null;
  }

  static List<AssetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetResponseDto-objects as value to a dart map
  static Map<String, List<AssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetResponseDto.listFromJson(entry.value, growable: growable,);
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
    'fileCreatedAt',
    'fileModifiedAt',
    'hasMetadata',
    'height',
    'id',
    'isArchived',
    'isEdited',
    'isFavorite',
    'isOffline',
    'isTrashed',
    'localDateTime',
    'originalFileName',
    'originalPath',
    'ownerId',
    'thumbhash',
    'type',
    'updatedAt',
    'visibility',
    'width',
  };
}

/// Asset type
class AssetResponseDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const AssetResponseDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const IMAGE = AssetResponseDtoTypeEnum._(r'IMAGE');
  static const VIDEO = AssetResponseDtoTypeEnum._(r'VIDEO');
  static const AUDIO = AssetResponseDtoTypeEnum._(r'AUDIO');
  static const OTHER = AssetResponseDtoTypeEnum._(r'OTHER');

  /// List of all possible values in this [enum][AssetResponseDtoTypeEnum].
  static const values = <AssetResponseDtoTypeEnum>[
    IMAGE,
    VIDEO,
    AUDIO,
    OTHER,
  ];

  static AssetResponseDtoTypeEnum? fromJson(dynamic value) => AssetResponseDtoTypeEnumTypeTransformer().decode(value);

  static List<AssetResponseDtoTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetResponseDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetResponseDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetResponseDtoTypeEnum] to String,
/// and [decode] dynamic data back to [AssetResponseDtoTypeEnum].
class AssetResponseDtoTypeEnumTypeTransformer {
  factory AssetResponseDtoTypeEnumTypeTransformer() => _instance ??= const AssetResponseDtoTypeEnumTypeTransformer._();

  const AssetResponseDtoTypeEnumTypeTransformer._();

  String encode(AssetResponseDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetResponseDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetResponseDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'IMAGE': return AssetResponseDtoTypeEnum.IMAGE;
        case r'VIDEO': return AssetResponseDtoTypeEnum.VIDEO;
        case r'AUDIO': return AssetResponseDtoTypeEnum.AUDIO;
        case r'OTHER': return AssetResponseDtoTypeEnum.OTHER;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetResponseDtoTypeEnumTypeTransformer] instance.
  static AssetResponseDtoTypeEnumTypeTransformer? _instance;
}


/// Asset visibility
class AssetResponseDtoVisibilityEnum {
  /// Instantiate a new enum with the provided [value].
  const AssetResponseDtoVisibilityEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const archive = AssetResponseDtoVisibilityEnum._(r'archive');
  static const timeline = AssetResponseDtoVisibilityEnum._(r'timeline');
  static const hidden = AssetResponseDtoVisibilityEnum._(r'hidden');
  static const locked = AssetResponseDtoVisibilityEnum._(r'locked');

  /// List of all possible values in this [enum][AssetResponseDtoVisibilityEnum].
  static const values = <AssetResponseDtoVisibilityEnum>[
    archive,
    timeline,
    hidden,
    locked,
  ];

  static AssetResponseDtoVisibilityEnum? fromJson(dynamic value) => AssetResponseDtoVisibilityEnumTypeTransformer().decode(value);

  static List<AssetResponseDtoVisibilityEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetResponseDtoVisibilityEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetResponseDtoVisibilityEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetResponseDtoVisibilityEnum] to String,
/// and [decode] dynamic data back to [AssetResponseDtoVisibilityEnum].
class AssetResponseDtoVisibilityEnumTypeTransformer {
  factory AssetResponseDtoVisibilityEnumTypeTransformer() => _instance ??= const AssetResponseDtoVisibilityEnumTypeTransformer._();

  const AssetResponseDtoVisibilityEnumTypeTransformer._();

  String encode(AssetResponseDtoVisibilityEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetResponseDtoVisibilityEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetResponseDtoVisibilityEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'archive': return AssetResponseDtoVisibilityEnum.archive;
        case r'timeline': return AssetResponseDtoVisibilityEnum.timeline;
        case r'hidden': return AssetResponseDtoVisibilityEnum.hidden;
        case r'locked': return AssetResponseDtoVisibilityEnum.locked;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetResponseDtoVisibilityEnumTypeTransformer] instance.
  static AssetResponseDtoVisibilityEnumTypeTransformer? _instance;
}


