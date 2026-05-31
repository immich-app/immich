// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetResponseDto {
  const AssetResponseDto({
    required this.checksum,
    required this.createdAt,
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
    this.people,
    this.resized,
    this.stack,
    this.tags,
    required this.thumbhash,
    required this.type,
    required this.updatedAt,
    required this.visibility,
    required this.width,
  });

  /// Base64 encoded SHA1 hash
  final String checksum;

  /// The UTC timestamp when the asset was originally uploaded to Immich.
  final DateTime createdAt;

  /// Duplicate group ID
  final String? duplicateId;

  /// Video/gif duration in milliseconds (null for static images)
  final int? duration;

  final ExifResponseDto? exifInfo;

  /// The actual UTC timestamp when the file was created/captured, preserving timezone information. This is the authoritative timestamp for chronological sorting within timeline groups. Combined with timezone data, this can be used to determine the exact moment the photo was taken.
  final DateTime fileCreatedAt;

  /// The UTC timestamp when the file was last modified on the filesystem. This reflects the last time the physical file was changed, which may be different from when the photo was originally taken.
  final DateTime fileModifiedAt;

  /// Whether asset has metadata
  final bool hasMetadata;

  /// Asset height
  final int? height;

  /// Asset ID
  final String id;

  /// Is archived
  final bool isArchived;

  /// Is edited
  /// Available since server v2.5.0.
  final bool isEdited;

  /// Is favorite
  final bool isFavorite;

  /// Is offline
  final bool isOffline;

  /// Is trashed
  final bool isTrashed;

  /// Library ID
  /// Available since server v1.0.0.
  @Deprecated(r'Deprecated by the Immich server API since v1.0.0.')
  final String? libraryId;

  /// Live photo video ID
  final String? livePhotoVideoId;

  /// The local date and time when the photo/video was taken, derived from EXIF metadata. This represents the photographer's local time regardless of timezone, stored as a timezone-agnostic timestamp. Used for timeline grouping by "local" days and months.
  final DateTime localDateTime;

  /// Original file name
  final String originalFileName;

  /// Original MIME type
  final String? originalMimeType;

  /// Original file path
  final String originalPath;

  final UserResponseDto? owner;

  /// Owner user ID
  final String ownerId;

  final List<PersonResponseDto>? people;

  /// Is resized
  /// Available since server v1.0.0.
  @Deprecated(r'Deprecated by the Immich server API since v1.113.0.')
  final bool? resized;

  final AssetStackResponseDto? stack;

  final List<TagResponseDto>? tags;

  /// Thumbhash for thumbnail generation (base64) also used as the c query param for thumbnail cache busting.
  final String? thumbhash;

  final AssetTypeEnum type;

  /// The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified.
  final DateTime updatedAt;

  final AssetVisibility visibility;

  /// Asset width
  final int? width;

  static const _undefined = Object();

  static const ApiVersion isEditedAddedIn = .new(2, 5, 0);

  static const ApiState isEditedState = .beta;

  static const ApiVersion libraryIdAddedIn = .new(1, 0, 0);

  static const ApiVersion libraryIdDeprecatedIn = .new(1, 0, 0);

  static const ApiState libraryIdState = .deprecated;

  static const ApiVersion resizedAddedIn = .new(1, 0, 0);

  static const ApiVersion resizedDeprecatedIn = .new(1, 113, 0);

  static const ApiState resizedState = .deprecated;

  static AssetResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      checksum: json[r'checksum'] as String,
      createdAt: DateTime.parse(json[r'createdAt'] as String),
      duplicateId: (json[r'duplicateId'] as String?),
      duration: (json[r'duration'] as int?),
      exifInfo: ExifResponseDto.fromJson(json[r'exifInfo']),
      fileCreatedAt: DateTime.parse(json[r'fileCreatedAt'] as String),
      fileModifiedAt: DateTime.parse(json[r'fileModifiedAt'] as String),
      hasMetadata: json[r'hasMetadata'] as bool,
      height: (json[r'height'] as int?),
      id: json[r'id'] as String,
      isArchived: json[r'isArchived'] as bool,
      isEdited: json[r'isEdited'] as bool,
      isFavorite: json[r'isFavorite'] as bool,
      isOffline: json[r'isOffline'] as bool,
      isTrashed: json[r'isTrashed'] as bool,
      libraryId: (json[r'libraryId'] as String?),
      livePhotoVideoId: (json[r'livePhotoVideoId'] as String?),
      localDateTime: DateTime.parse(json[r'localDateTime'] as String),
      originalFileName: json[r'originalFileName'] as String,
      originalMimeType: (json[r'originalMimeType'] as String?),
      originalPath: json[r'originalPath'] as String,
      owner: UserResponseDto.fromJson(json[r'owner']),
      ownerId: json[r'ownerId'] as String,
      people: (json[r'people'] as List?)?.map(($e) => (PersonResponseDto.fromJson($e))!).toList(growable: false),
      resized: (json[r'resized'] as bool?),
      stack: AssetStackResponseDto.fromJson(json[r'stack']),
      tags: (json[r'tags'] as List?)?.map(($e) => (TagResponseDto.fromJson($e))!).toList(growable: false),
      thumbhash: (json[r'thumbhash'] as String?),
      type: (AssetTypeEnum.fromJson(json[r'type']))!,
      updatedAt: DateTime.parse(json[r'updatedAt'] as String),
      visibility: (AssetVisibility.fromJson(json[r'visibility']))!,
      width: (json[r'width'] as int?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'checksum'] = checksum;
    json[r'createdAt'] = createdAt.toUtc().toIso8601String();
    if (duplicateId != null) {
      json[r'duplicateId'] = duplicateId!;
    }
    if (duration != null) {
      json[r'duration'] = duration!;
    }
    if (exifInfo != null) {
      json[r'exifInfo'] = exifInfo!.toJson();
    }
    json[r'fileCreatedAt'] = fileCreatedAt.toUtc().toIso8601String();
    json[r'fileModifiedAt'] = fileModifiedAt.toUtc().toIso8601String();
    json[r'hasMetadata'] = hasMetadata;
    if (height != null) {
      json[r'height'] = height!;
    }
    json[r'id'] = id;
    json[r'isArchived'] = isArchived;
    json[r'isEdited'] = isEdited;
    json[r'isFavorite'] = isFavorite;
    json[r'isOffline'] = isOffline;
    json[r'isTrashed'] = isTrashed;
    if (libraryId != null) {
      json[r'libraryId'] = libraryId!;
    }
    if (livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = livePhotoVideoId!;
    }
    json[r'localDateTime'] = localDateTime.toUtc().toIso8601String();
    json[r'originalFileName'] = originalFileName;
    if (originalMimeType != null) {
      json[r'originalMimeType'] = originalMimeType!;
    }
    json[r'originalPath'] = originalPath;
    if (owner != null) {
      json[r'owner'] = owner!.toJson();
    }
    json[r'ownerId'] = ownerId;
    if (people != null) {
      json[r'people'] = people!.map(($e) => $e.toJson()).toList(growable: false);
    }
    if (resized != null) {
      json[r'resized'] = resized!;
    }
    if (stack != null) {
      json[r'stack'] = stack!.toJson();
    }
    if (tags != null) {
      json[r'tags'] = tags!.map(($e) => $e.toJson()).toList(growable: false);
    }
    if (thumbhash != null) {
      json[r'thumbhash'] = thumbhash!;
    }
    json[r'type'] = type.toJson();
    json[r'updatedAt'] = updatedAt.toUtc().toIso8601String();
    json[r'visibility'] = visibility.toJson();
    if (width != null) {
      json[r'width'] = width!;
    }
    return json;
  }

  AssetResponseDto copyWith({
    String? checksum,
    DateTime? createdAt,
    Object? duplicateId = _undefined,
    Object? duration = _undefined,
    Object? exifInfo = _undefined,
    DateTime? fileCreatedAt,
    DateTime? fileModifiedAt,
    bool? hasMetadata,
    Object? height = _undefined,
    String? id,
    bool? isArchived,
    bool? isEdited,
    bool? isFavorite,
    bool? isOffline,
    bool? isTrashed,
    Object? libraryId = _undefined,
    Object? livePhotoVideoId = _undefined,
    DateTime? localDateTime,
    String? originalFileName,
    Object? originalMimeType = _undefined,
    String? originalPath,
    Object? owner = _undefined,
    String? ownerId,
    Object? people = _undefined,
    Object? resized = _undefined,
    Object? stack = _undefined,
    Object? tags = _undefined,
    Object? thumbhash = _undefined,
    AssetTypeEnum? type,
    DateTime? updatedAt,
    AssetVisibility? visibility,
    Object? width = _undefined,
  }) {
    return .new(
      checksum: checksum ?? this.checksum,
      createdAt: createdAt ?? this.createdAt,
      duplicateId: identical(duplicateId, _undefined) ? this.duplicateId : duplicateId as String?,
      duration: identical(duration, _undefined) ? this.duration : duration as int?,
      exifInfo: identical(exifInfo, _undefined) ? this.exifInfo : exifInfo as ExifResponseDto?,
      fileCreatedAt: fileCreatedAt ?? this.fileCreatedAt,
      fileModifiedAt: fileModifiedAt ?? this.fileModifiedAt,
      hasMetadata: hasMetadata ?? this.hasMetadata,
      height: identical(height, _undefined) ? this.height : height as int?,
      id: id ?? this.id,
      isArchived: isArchived ?? this.isArchived,
      isEdited: isEdited ?? this.isEdited,
      isFavorite: isFavorite ?? this.isFavorite,
      isOffline: isOffline ?? this.isOffline,
      isTrashed: isTrashed ?? this.isTrashed,
      libraryId: identical(libraryId, _undefined) ? this.libraryId : libraryId as String?,
      livePhotoVideoId: identical(livePhotoVideoId, _undefined) ? this.livePhotoVideoId : livePhotoVideoId as String?,
      localDateTime: localDateTime ?? this.localDateTime,
      originalFileName: originalFileName ?? this.originalFileName,
      originalMimeType: identical(originalMimeType, _undefined) ? this.originalMimeType : originalMimeType as String?,
      originalPath: originalPath ?? this.originalPath,
      owner: identical(owner, _undefined) ? this.owner : owner as UserResponseDto?,
      ownerId: ownerId ?? this.ownerId,
      people: identical(people, _undefined) ? this.people : people as List<PersonResponseDto>?,
      resized: identical(resized, _undefined) ? this.resized : resized as bool?,
      stack: identical(stack, _undefined) ? this.stack : stack as AssetStackResponseDto?,
      tags: identical(tags, _undefined) ? this.tags : tags as List<TagResponseDto>?,
      thumbhash: identical(thumbhash, _undefined) ? this.thumbhash : thumbhash as String?,
      type: type ?? this.type,
      updatedAt: updatedAt ?? this.updatedAt,
      visibility: visibility ?? this.visibility,
      width: identical(width, _undefined) ? this.width : width as int?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetResponseDto &&
            checksum == other.checksum &&
            createdAt == other.createdAt &&
            duplicateId == other.duplicateId &&
            duration == other.duration &&
            exifInfo == other.exifInfo &&
            fileCreatedAt == other.fileCreatedAt &&
            fileModifiedAt == other.fileModifiedAt &&
            hasMetadata == other.hasMetadata &&
            height == other.height &&
            id == other.id &&
            isArchived == other.isArchived &&
            isEdited == other.isEdited &&
            isFavorite == other.isFavorite &&
            isOffline == other.isOffline &&
            isTrashed == other.isTrashed &&
            libraryId == other.libraryId &&
            livePhotoVideoId == other.livePhotoVideoId &&
            localDateTime == other.localDateTime &&
            originalFileName == other.originalFileName &&
            originalMimeType == other.originalMimeType &&
            originalPath == other.originalPath &&
            owner == other.owner &&
            ownerId == other.ownerId &&
            const DeepCollectionEquality().equals(people, other.people) &&
            resized == other.resized &&
            stack == other.stack &&
            const DeepCollectionEquality().equals(tags, other.tags) &&
            thumbhash == other.thumbhash &&
            type == other.type &&
            updatedAt == other.updatedAt &&
            visibility == other.visibility &&
            width == other.width);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      checksum,
      createdAt,
      duplicateId,
      duration,
      exifInfo,
      fileCreatedAt,
      fileModifiedAt,
      hasMetadata,
      height,
      id,
      isArchived,
      isEdited,
      isFavorite,
      isOffline,
      isTrashed,
      libraryId,
      livePhotoVideoId,
      localDateTime,
      originalFileName,
      originalMimeType,
      originalPath,
      owner,
      ownerId,
      const DeepCollectionEquality().hash(people),
      resized,
      stack,
      const DeepCollectionEquality().hash(tags),
      thumbhash,
      type,
      updatedAt,
      visibility,
      width,
    ]);
  }

  @override
  String toString() =>
      'AssetResponseDto(checksum=$checksum, createdAt=$createdAt, duplicateId=$duplicateId, duration=$duration, exifInfo=$exifInfo, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, hasMetadata=$hasMetadata, height=$height, id=$id, isArchived=$isArchived, isEdited=$isEdited, isFavorite=$isFavorite, isOffline=$isOffline, isTrashed=$isTrashed, libraryId=$libraryId, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, originalFileName=$originalFileName, originalMimeType=$originalMimeType, originalPath=$originalPath, owner=$owner, ownerId=$ownerId, people=$people, resized=$resized, stack=$stack, tags=$tags, thumbhash=$thumbhash, type=$type, updatedAt=$updatedAt, visibility=$visibility, width=$width)';
}
