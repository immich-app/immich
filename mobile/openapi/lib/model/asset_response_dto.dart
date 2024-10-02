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
    this.smartInfo,
    this.stack,
    this.tags = const [],
    required this.thumbhash,
    required this.type,
    this.unassignedFaces = const [],
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

  bool isFavorite;

  bool isOffline;

  bool isTrashed;

  /// This property was deprecated in v1.106.0
  String? libraryId;

  String? livePhotoVideoId;

  DateTime localDateTime;

  String originalFileName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? originalMimeType;

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

  /// This property was deprecated in v1.113.0
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
  SmartInfoResponseDto? smartInfo;

  AssetStackResponseDto? stack;

  List<TagResponseDto> tags;

  String? thumbhash;

  AssetTypeEnum type;

  List<AssetFaceWithoutPersonResponseDto> unassignedFaces;

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
    other.smartInfo == smartInfo &&
    other.stack == stack &&
    _deepEquality.equals(other.tags, tags) &&
    other.thumbhash == thumbhash &&
    other.type == type &&
    _deepEquality.equals(other.unassignedFaces, unassignedFaces) &&
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
    (smartInfo == null ? 0 : smartInfo!.hashCode) +
    (stack == null ? 0 : stack!.hashCode) +
    (tags.hashCode) +
    (thumbhash == null ? 0 : thumbhash!.hashCode) +
    (type.hashCode) +
    (unassignedFaces.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AssetResponseDto[checksum=$checksum, deviceAssetId=$deviceAssetId, deviceId=$deviceId, duplicateId=$duplicateId, duration=$duration, exifInfo=$exifInfo, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, hasMetadata=$hasMetadata, id=$id, isArchived=$isArchived, isFavorite=$isFavorite, isOffline=$isOffline, isTrashed=$isTrashed, libraryId=$libraryId, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, originalFileName=$originalFileName, originalMimeType=$originalMimeType, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, people=$people, resized=$resized, smartInfo=$smartInfo, stack=$stack, tags=$tags, thumbhash=$thumbhash, type=$type, unassignedFaces=$unassignedFaces, updatedAt=$updatedAt]';

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
      json[r'localDateTime'] = this.localDateTime.toUtc().toIso8601String();
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
    if (this.smartInfo != null) {
      json[r'smartInfo'] = this.smartInfo;
    } else {
    //  json[r'smartInfo'] = null;
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
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
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
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isOffline: mapValueOfType<bool>(json, r'isOffline')!,
        isTrashed: mapValueOfType<bool>(json, r'isTrashed')!,
        libraryId: mapValueOfType<String>(json, r'libraryId'),
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        localDateTime: mapDateTime(json, r'localDateTime', r'')!,
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        originalMimeType: mapValueOfType<String>(json, r'originalMimeType'),
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        owner: UserResponseDto.fromJson(json[r'owner']),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        people: PersonWithFacesResponseDto.listFromJson(json[r'people']),
        resized: mapValueOfType<bool>(json, r'resized'),
        smartInfo: SmartInfoResponseDto.fromJson(json[r'smartInfo']),
        stack: AssetStackResponseDto.fromJson(json[r'stack']),
        tags: TagResponseDto.listFromJson(json[r'tags']),
        thumbhash: mapValueOfType<String>(json, r'thumbhash'),
        type: AssetTypeEnum.fromJson(json[r'type'])!,
        unassignedFaces: AssetFaceWithoutPersonResponseDto.listFromJson(json[r'unassignedFaces']),
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
    'localDateTime',
    'originalFileName',
    'originalPath',
    'ownerId',
    'thumbhash',
    'type',
    'updatedAt',
  };
}

