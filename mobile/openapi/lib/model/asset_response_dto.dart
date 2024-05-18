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
    required this.deviceAssetId,
    required this.deviceId,
    this.duplicateId,
    required this.duration,
    this.exifInfo,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.hasMetadata,
    required this.id,
    required this.isArchived,
    this.isExternal,
    required this.isFavorite,
    required this.isOffline,
    this.isReadOnly,
    required this.isTrashed,
    required this.libraryId,
    this.livePhotoVideoId,
    required this.localDateTime,
    required this.originalFileName,
    required this.originalPath,
    this.owner,
    required this.ownerId,
    this.people = const [],
    required this.resized,
    this.smartInfo,
    this.stack = const [],
    required this.stackCount,
    this.stackParentId,
    this.tags = const [],
    required this.thumbhash,
    required this.type,
    required this.updatedAt,
  });

  /// base64 encoded sha1 hash
  String checksum;

  String deviceAssetId;

  String deviceId;

  String? duplicateId;

  String duration;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  ExifResponseDto? exifInfo;

  DateTime fileCreatedAt;

  DateTime fileModifiedAt;

  bool hasMetadata;

  String id;

  bool isArchived;

  /// This property was deprecated in v1.104.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isExternal;

  bool isFavorite;

  bool isOffline;

  /// This property was deprecated in v1.104.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isReadOnly;

  bool isTrashed;

  String libraryId;

  String? livePhotoVideoId;

  DateTime localDateTime;

  String originalFileName;

  String originalPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  UserResponseDto? owner;

  String ownerId;

  List<PersonWithFacesResponseDto> people;

  bool resized;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SmartInfoResponseDto? smartInfo;

  List<AssetResponseDto> stack;

  int? stackCount;

  String? stackParentId;

  List<TagResponseDto> tags;

  String? thumbhash;

  AssetTypeEnum type;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetResponseDto &&
    other.checksum == checksum &&
    other.deviceAssetId == deviceAssetId &&
    other.deviceId == deviceId &&
    other.duplicateId == duplicateId &&
    other.duration == duration &&
    other.exifInfo == exifInfo &&
    other.fileCreatedAt == fileCreatedAt &&
    other.fileModifiedAt == fileModifiedAt &&
    other.hasMetadata == hasMetadata &&
    other.id == id &&
    other.isArchived == isArchived &&
    other.isExternal == isExternal &&
    other.isFavorite == isFavorite &&
    other.isOffline == isOffline &&
    other.isReadOnly == isReadOnly &&
    other.isTrashed == isTrashed &&
    other.libraryId == libraryId &&
    other.livePhotoVideoId == livePhotoVideoId &&
    other.localDateTime == localDateTime &&
    other.originalFileName == originalFileName &&
    other.originalPath == originalPath &&
    other.owner == owner &&
    other.ownerId == ownerId &&
    _deepEquality.equals(other.people, people) &&
    other.resized == resized &&
    other.smartInfo == smartInfo &&
    _deepEquality.equals(other.stack, stack) &&
    other.stackCount == stackCount &&
    other.stackParentId == stackParentId &&
    _deepEquality.equals(other.tags, tags) &&
    other.thumbhash == thumbhash &&
    other.type == type &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (deviceAssetId.hashCode) +
    (deviceId.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (duration.hashCode) +
    (exifInfo == null ? 0 : exifInfo!.hashCode) +
    (fileCreatedAt.hashCode) +
    (fileModifiedAt.hashCode) +
    (hasMetadata.hashCode) +
    (id.hashCode) +
    (isArchived.hashCode) +
    (isExternal == null ? 0 : isExternal!.hashCode) +
    (isFavorite.hashCode) +
    (isOffline.hashCode) +
    (isReadOnly == null ? 0 : isReadOnly!.hashCode) +
    (isTrashed.hashCode) +
    (libraryId.hashCode) +
    (livePhotoVideoId == null ? 0 : livePhotoVideoId!.hashCode) +
    (localDateTime.hashCode) +
    (originalFileName.hashCode) +
    (originalPath.hashCode) +
    (owner == null ? 0 : owner!.hashCode) +
    (ownerId.hashCode) +
    (people.hashCode) +
    (resized.hashCode) +
    (smartInfo == null ? 0 : smartInfo!.hashCode) +
    (stack.hashCode) +
    (stackCount == null ? 0 : stackCount!.hashCode) +
    (stackParentId == null ? 0 : stackParentId!.hashCode) +
    (tags.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AssetResponseDto[checksum=$checksum, deviceAssetId=$deviceAssetId, deviceId=$deviceId, duplicateId=$duplicateId, duration=$duration, exifInfo=$exifInfo, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, hasMetadata=$hasMetadata, id=$id, isArchived=$isArchived, isExternal=$isExternal, isFavorite=$isFavorite, isOffline=$isOffline, isReadOnly=$isReadOnly, isTrashed=$isTrashed, libraryId=$libraryId, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, originalFileName=$originalFileName, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, people=$people, resized=$resized, smartInfo=$smartInfo, stack=$stack, stackCount=$stackCount, stackParentId=$stackParentId, tags=$tags, thumbhash=$thumbhash, type=$type, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
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
      json[r'fileCreatedAt'] = this.fileCreatedAt.toUtc().toIso8601String();
      json[r'fileModifiedAt'] = this.fileModifiedAt.toUtc().toIso8601String();
      json[r'hasMetadata'] = this.hasMetadata;
      json[r'id'] = this.id;
      json[r'isArchived'] = this.isArchived;
    if (this.isExternal != null) {
      json[r'isExternal'] = this.isExternal;
    } else {
    //  json[r'isExternal'] = null;
    }
      json[r'isFavorite'] = this.isFavorite;
      json[r'isOffline'] = this.isOffline;
    if (this.isReadOnly != null) {
      json[r'isReadOnly'] = this.isReadOnly;
    } else {
    //  json[r'isReadOnly'] = null;
    }
      json[r'isTrashed'] = this.isTrashed;
      json[r'libraryId'] = this.libraryId;
    if (this.livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = this.livePhotoVideoId;
    } else {
    //  json[r'livePhotoVideoId'] = null;
    }
      json[r'localDateTime'] = this.localDateTime.toUtc().toIso8601String();
      json[r'originalFileName'] = this.originalFileName;
      json[r'originalPath'] = this.originalPath;
    if (this.owner != null) {
      json[r'owner'] = this.owner;
    } else {
    //  json[r'owner'] = null;
    }
      json[r'ownerId'] = this.ownerId;
      json[r'people'] = this.people;
      json[r'resized'] = this.resized;
    if (this.smartInfo != null) {
      json[r'smartInfo'] = this.smartInfo;
    } else {
    //  json[r'smartInfo'] = null;
    }
      json[r'stack'] = this.stack;
    if (this.stackCount != null) {
      json[r'stackCount'] = this.stackCount;
    } else {
    //  json[r'stackCount'] = null;
    }
    if (this.stackParentId != null) {
      json[r'stackParentId'] = this.stackParentId;
    } else {
    //  json[r'stackParentId'] = null;
    }
      json[r'tags'] = this.tags;
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
    //  json[r'thumbhash'] = null;
    }
      json[r'type'] = this.type;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [AssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetResponseDto(
        checksum: mapValueOfType<String>(json, r'checksum')!,
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId')!,
        deviceId: mapValueOfType<String>(json, r'deviceId')!,
        duplicateId: mapValueOfType<String>(json, r'duplicateId'),
        duration: mapValueOfType<String>(json, r'duration')!,
        exifInfo: ExifResponseDto.fromJson(json[r'exifInfo']),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r'')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', r'')!,
        hasMetadata: mapValueOfType<bool>(json, r'hasMetadata')!,
        id: mapValueOfType<String>(json, r'id')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived')!,
        isExternal: mapValueOfType<bool>(json, r'isExternal'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isOffline: mapValueOfType<bool>(json, r'isOffline')!,
        isReadOnly: mapValueOfType<bool>(json, r'isReadOnly'),
        isTrashed: mapValueOfType<bool>(json, r'isTrashed')!,
        libraryId: mapValueOfType<String>(json, r'libraryId')!,
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        localDateTime: mapDateTime(json, r'localDateTime', r'')!,
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        owner: UserResponseDto.fromJson(json[r'owner']),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        people: PersonWithFacesResponseDto.listFromJson(json[r'people']),
        resized: mapValueOfType<bool>(json, r'resized')!,
        smartInfo: SmartInfoResponseDto.fromJson(json[r'smartInfo']),
        stack: AssetResponseDto.listFromJson(json[r'stack']),
        stackCount: mapValueOfType<int>(json, r'stackCount'),
        stackParentId: mapValueOfType<String>(json, r'stackParentId'),
        tags: TagResponseDto.listFromJson(json[r'tags']),
        thumbhash: mapValueOfType<String>(json, r'thumbhash'),
        type: AssetTypeEnum.fromJson(json[r'type'])!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
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
    'deviceAssetId',
    'deviceId',
    'duration',
    'fileCreatedAt',
    'fileModifiedAt',
    'hasMetadata',
    'id',
    'isArchived',
    'isFavorite',
    'isOffline',
    'isTrashed',
    'libraryId',
    'localDateTime',
    'originalFileName',
    'originalPath',
    'ownerId',
    'resized',
    'stackCount',
    'thumbhash',
    'type',
    'updatedAt',
  };
}

