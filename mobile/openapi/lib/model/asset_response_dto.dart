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
    this.duplicateId = const Optional.absent(),
    required this.duration,
    this.exifInfo = const Optional.absent(),
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
    this.libraryId = const Optional.absent(),
    this.livePhotoVideoId = const Optional.absent(),
    required this.localDateTime,
    required this.originalFileName,
    this.originalMimeType = const Optional.absent(),
    required this.originalPath,
    this.owner = const Optional.absent(),
    required this.ownerId,
    this.people = const Optional.present(const []),
    this.resized = const Optional.absent(),
    this.stack = const Optional.absent(),
    this.tags = const Optional.present(const []),
    required this.thumbhash,
    required this.type,
    required this.updatedAt,
    required this.visibility,
    required this.width,
  });

  /// Base64 encoded SHA1 hash
  String checksum;

  /// The UTC timestamp when the asset was originally uploaded to Immich.
  DateTime createdAt;

  /// Duplicate group ID
  Optional<String?> duplicateId;

  /// Video/gif duration in milliseconds (null for static images)
  ///
  /// Minimum value: 0
  /// Maximum value: 2147483647
  int? duration;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<ExifResponseDto?> exifInfo;

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

  /// Library ID
  Optional<String?> libraryId;

  /// Live photo video ID
  Optional<String?> livePhotoVideoId;

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
  Optional<String?> originalMimeType;

  /// Original file path
  String originalPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<UserResponseDto?> owner;

  /// Owner user ID
  String ownerId;

  Optional<List<PersonResponseDto>?> people;

  /// Is resized
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> resized;

  Optional<AssetStackResponseDto?> stack;

  Optional<List<TagResponseDto>?> tags;

  /// Thumbhash for thumbnail generation (base64) also used as the c query param for thumbnail cache busting.
  String? thumbhash;

  AssetTypeEnum type;

  /// The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified.
  DateTime updatedAt;

  AssetVisibility visibility;

  /// Asset width
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int? width;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetResponseDto &&
    other.checksum == checksum &&
    other.createdAt == createdAt &&
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
    other.updatedAt == updatedAt &&
    other.visibility == visibility &&
    other.width == width;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum.hashCode) +
    (createdAt.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (duration == null ? 0 : duration!.hashCode) +
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
    (updatedAt.hashCode) +
    (visibility.hashCode) +
    (width == null ? 0 : width!.hashCode);

  @override
  String toString() => 'AssetResponseDto[checksum=$checksum, createdAt=$createdAt, duplicateId=$duplicateId, duration=$duration, exifInfo=$exifInfo, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, hasMetadata=$hasMetadata, height=$height, id=$id, isArchived=$isArchived, isEdited=$isEdited, isFavorite=$isFavorite, isOffline=$isOffline, isTrashed=$isTrashed, libraryId=$libraryId, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, originalFileName=$originalFileName, originalMimeType=$originalMimeType, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, people=$people, resized=$resized, stack=$stack, tags=$tags, thumbhash=$thumbhash, type=$type, updatedAt=$updatedAt, visibility=$visibility, width=$width]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'checksum'] = this.checksum;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.duplicateId.isPresent) {
      final value = this.duplicateId.value;
      json[r'duplicateId'] = value;
    }
    if (this.duration != null) {
      json[r'duration'] = this.duration;
    } else {
      json[r'duration'] = null;
    }
    if (this.exifInfo.isPresent) {
      final value = this.exifInfo.value;
      json[r'exifInfo'] = value;
    }
      json[r'fileCreatedAt'] = this.fileCreatedAt.toUtc().toIso8601String();
      json[r'fileModifiedAt'] = this.fileModifiedAt.toUtc().toIso8601String();
      json[r'hasMetadata'] = this.hasMetadata;
    if (this.height != null) {
      json[r'height'] = this.height;
    } else {
      json[r'height'] = null;
    }
      json[r'id'] = this.id;
      json[r'isArchived'] = this.isArchived;
      json[r'isEdited'] = this.isEdited;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isOffline'] = this.isOffline;
      json[r'isTrashed'] = this.isTrashed;
    if (this.libraryId.isPresent) {
      final value = this.libraryId.value;
      json[r'libraryId'] = value;
    }
    if (this.livePhotoVideoId.isPresent) {
      final value = this.livePhotoVideoId.value;
      json[r'livePhotoVideoId'] = value;
    }
      json[r'localDateTime'] = this.localDateTime.toUtc().toIso8601String();
      json[r'originalFileName'] = this.originalFileName;
    if (this.originalMimeType.isPresent) {
      final value = this.originalMimeType.value;
      json[r'originalMimeType'] = value;
    }
      json[r'originalPath'] = this.originalPath;
    if (this.owner.isPresent) {
      final value = this.owner.value;
      json[r'owner'] = value;
    }
      json[r'ownerId'] = this.ownerId;
    if (this.people.isPresent) {
      final value = this.people.value;
      json[r'people'] = value;
    }
    if (this.resized.isPresent) {
      final value = this.resized.value;
      json[r'resized'] = value;
    }
    if (this.stack.isPresent) {
      final value = this.stack.value;
      json[r'stack'] = value;
    }
    if (this.tags.isPresent) {
      final value = this.tags.value;
      json[r'tags'] = value;
    }
    if (this.thumbhash != null) {
      json[r'thumbhash'] = this.thumbhash;
    } else {
      json[r'thumbhash'] = null;
    }
      json[r'type'] = this.type;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
      json[r'visibility'] = this.visibility;
    if (this.width != null) {
      json[r'width'] = this.width;
    } else {
      json[r'width'] = null;
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
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        duplicateId: json.containsKey(r'duplicateId') ? Optional.present(mapValueOfType<String>(json, r'duplicateId')) : const Optional.absent(),
        duration: mapValueOfType<int>(json, r'duration'),
        exifInfo: json.containsKey(r'exifInfo') ? Optional.present(ExifResponseDto.fromJson(json[r'exifInfo'])) : const Optional.absent(),
        fileCreatedAt: mapDateTime(json, r'fileCreatedAt', r'')!,
        fileModifiedAt: mapDateTime(json, r'fileModifiedAt', r'')!,
        hasMetadata: mapValueOfType<bool>(json, r'hasMetadata')!,
        height: mapValueOfType<int>(json, r'height'),
        id: mapValueOfType<String>(json, r'id')!,
        isArchived: mapValueOfType<bool>(json, r'isArchived')!,
        isEdited: mapValueOfType<bool>(json, r'isEdited')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        isOffline: mapValueOfType<bool>(json, r'isOffline')!,
        isTrashed: mapValueOfType<bool>(json, r'isTrashed')!,
        libraryId: json.containsKey(r'libraryId') ? Optional.present(mapValueOfType<String>(json, r'libraryId')) : const Optional.absent(),
        livePhotoVideoId: json.containsKey(r'livePhotoVideoId') ? Optional.present(mapValueOfType<String>(json, r'livePhotoVideoId')) : const Optional.absent(),
        localDateTime: mapDateTime(json, r'localDateTime', r'')!,
        originalFileName: mapValueOfType<String>(json, r'originalFileName')!,
        originalMimeType: json.containsKey(r'originalMimeType') ? Optional.present(mapValueOfType<String>(json, r'originalMimeType')) : const Optional.absent(),
        originalPath: mapValueOfType<String>(json, r'originalPath')!,
        owner: json.containsKey(r'owner') ? Optional.present(UserResponseDto.fromJson(json[r'owner'])) : const Optional.absent(),
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        people: json.containsKey(r'people') ? Optional.present(PersonResponseDto.listFromJson(json[r'people'])) : const Optional.absent(),
        resized: json.containsKey(r'resized') ? Optional.present(mapValueOfType<bool>(json, r'resized')) : const Optional.absent(),
        stack: json.containsKey(r'stack') ? Optional.present(AssetStackResponseDto.fromJson(json[r'stack'])) : const Optional.absent(),
        tags: json.containsKey(r'tags') ? Optional.present(TagResponseDto.listFromJson(json[r'tags'])) : const Optional.absent(),
        thumbhash: mapValueOfType<String>(json, r'thumbhash'),
        type: AssetTypeEnum.fromJson(json[r'type'])!,
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
        visibility: AssetVisibility.fromJson(json[r'visibility'])!,
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

