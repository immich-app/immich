// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAssetV1 {
  const SyncAssetV1({
    required this.checksum,
    required this.createdAt,
    required this.deletedAt,
    required this.duration,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    required this.height,
    required this.id,
    required this.isEdited,
    required this.isFavorite,
    required this.libraryId,
    required this.livePhotoVideoId,
    required this.localDateTime,
    required this.originalFileName,
    required this.ownerId,
    required this.stackId,
    required this.thumbhash,
    required this.type,
    required this.visibility,
    required this.width,
  });

  /// Checksum
  final String checksum;

  /// Uploaded to Immich at
  final DateTime? createdAt;

  /// Deleted at
  final DateTime? deletedAt;

  /// Duration
  final String? duration;

  /// File created at
  final DateTime? fileCreatedAt;

  /// File modified at
  final DateTime? fileModifiedAt;

  /// Asset height
  final int? height;

  /// Asset ID
  final String id;

  /// Is edited
  final bool isEdited;

  /// Is favorite
  final bool isFavorite;

  /// Library ID
  final String? libraryId;

  /// Live photo video ID
  final String? livePhotoVideoId;

  /// Local date time
  final DateTime? localDateTime;

  /// Original file name
  final String originalFileName;

  /// Owner ID
  final String ownerId;

  /// Stack ID
  final String? stackId;

  /// Thumbhash
  final String? thumbhash;

  final AssetTypeEnum type;

  final AssetVisibility visibility;

  /// Asset width
  final int? width;

  static const _undefined = Object();

  static SyncAssetV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAssetV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      checksum: json[r'checksum'] as String,
      createdAt: (json[r'createdAt'] == null ? null : DateTime.parse(json[r'createdAt'] as String)),
      deletedAt: (json[r'deletedAt'] == null ? null : DateTime.parse(json[r'deletedAt'] as String)),
      duration: (json[r'duration'] as String?),
      fileCreatedAt: (json[r'fileCreatedAt'] == null ? null : DateTime.parse(json[r'fileCreatedAt'] as String)),
      fileModifiedAt: (json[r'fileModifiedAt'] == null ? null : DateTime.parse(json[r'fileModifiedAt'] as String)),
      height: (json[r'height'] as int?),
      id: json[r'id'] as String,
      isEdited: json[r'isEdited'] as bool,
      isFavorite: json[r'isFavorite'] as bool,
      libraryId: (json[r'libraryId'] as String?),
      livePhotoVideoId: (json[r'livePhotoVideoId'] as String?),
      localDateTime: (json[r'localDateTime'] == null ? null : DateTime.parse(json[r'localDateTime'] as String)),
      originalFileName: json[r'originalFileName'] as String,
      ownerId: json[r'ownerId'] as String,
      stackId: (json[r'stackId'] as String?),
      thumbhash: (json[r'thumbhash'] as String?),
      type: (AssetTypeEnum.fromJson(json[r'type']))!,
      visibility: (AssetVisibility.fromJson(json[r'visibility']))!,
      width: (json[r'width'] as int?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'checksum'] = checksum;
    if (createdAt != null) {
      json[r'createdAt'] = createdAt!.toUtc().toIso8601String();
    }
    if (deletedAt != null) {
      json[r'deletedAt'] = deletedAt!.toUtc().toIso8601String();
    }
    if (duration != null) {
      json[r'duration'] = duration!;
    }
    if (fileCreatedAt != null) {
      json[r'fileCreatedAt'] = fileCreatedAt!.toUtc().toIso8601String();
    }
    if (fileModifiedAt != null) {
      json[r'fileModifiedAt'] = fileModifiedAt!.toUtc().toIso8601String();
    }
    if (height != null) {
      json[r'height'] = height!;
    }
    json[r'id'] = id;
    json[r'isEdited'] = isEdited;
    json[r'isFavorite'] = isFavorite;
    if (libraryId != null) {
      json[r'libraryId'] = libraryId!;
    }
    if (livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = livePhotoVideoId!;
    }
    if (localDateTime != null) {
      json[r'localDateTime'] = localDateTime!.toUtc().toIso8601String();
    }
    json[r'originalFileName'] = originalFileName;
    json[r'ownerId'] = ownerId;
    if (stackId != null) {
      json[r'stackId'] = stackId!;
    }
    if (thumbhash != null) {
      json[r'thumbhash'] = thumbhash!;
    }
    json[r'type'] = type.toJson();
    json[r'visibility'] = visibility.toJson();
    if (width != null) {
      json[r'width'] = width!;
    }
    return json;
  }

  SyncAssetV1 copyWith({
    String? checksum,
    Object? createdAt = _undefined,
    Object? deletedAt = _undefined,
    Object? duration = _undefined,
    Object? fileCreatedAt = _undefined,
    Object? fileModifiedAt = _undefined,
    Object? height = _undefined,
    String? id,
    bool? isEdited,
    bool? isFavorite,
    Object? libraryId = _undefined,
    Object? livePhotoVideoId = _undefined,
    Object? localDateTime = _undefined,
    String? originalFileName,
    String? ownerId,
    Object? stackId = _undefined,
    Object? thumbhash = _undefined,
    AssetTypeEnum? type,
    AssetVisibility? visibility,
    Object? width = _undefined,
  }) {
    return .new(
      checksum: checksum ?? this.checksum,
      createdAt: identical(createdAt, _undefined) ? this.createdAt : createdAt as DateTime?,
      deletedAt: identical(deletedAt, _undefined) ? this.deletedAt : deletedAt as DateTime?,
      duration: identical(duration, _undefined) ? this.duration : duration as String?,
      fileCreatedAt: identical(fileCreatedAt, _undefined) ? this.fileCreatedAt : fileCreatedAt as DateTime?,
      fileModifiedAt: identical(fileModifiedAt, _undefined) ? this.fileModifiedAt : fileModifiedAt as DateTime?,
      height: identical(height, _undefined) ? this.height : height as int?,
      id: id ?? this.id,
      isEdited: isEdited ?? this.isEdited,
      isFavorite: isFavorite ?? this.isFavorite,
      libraryId: identical(libraryId, _undefined) ? this.libraryId : libraryId as String?,
      livePhotoVideoId: identical(livePhotoVideoId, _undefined) ? this.livePhotoVideoId : livePhotoVideoId as String?,
      localDateTime: identical(localDateTime, _undefined) ? this.localDateTime : localDateTime as DateTime?,
      originalFileName: originalFileName ?? this.originalFileName,
      ownerId: ownerId ?? this.ownerId,
      stackId: identical(stackId, _undefined) ? this.stackId : stackId as String?,
      thumbhash: identical(thumbhash, _undefined) ? this.thumbhash : thumbhash as String?,
      type: type ?? this.type,
      visibility: visibility ?? this.visibility,
      width: identical(width, _undefined) ? this.width : width as int?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAssetV1 &&
            checksum == other.checksum &&
            createdAt == other.createdAt &&
            deletedAt == other.deletedAt &&
            duration == other.duration &&
            fileCreatedAt == other.fileCreatedAt &&
            fileModifiedAt == other.fileModifiedAt &&
            height == other.height &&
            id == other.id &&
            isEdited == other.isEdited &&
            isFavorite == other.isFavorite &&
            libraryId == other.libraryId &&
            livePhotoVideoId == other.livePhotoVideoId &&
            localDateTime == other.localDateTime &&
            originalFileName == other.originalFileName &&
            ownerId == other.ownerId &&
            stackId == other.stackId &&
            thumbhash == other.thumbhash &&
            type == other.type &&
            visibility == other.visibility &&
            width == other.width);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      checksum,
      createdAt,
      deletedAt,
      duration,
      fileCreatedAt,
      fileModifiedAt,
      height,
      id,
      isEdited,
      isFavorite,
      libraryId,
      livePhotoVideoId,
      localDateTime,
      originalFileName,
      ownerId,
      stackId,
      thumbhash,
      type,
      visibility,
      width,
    ]);
  }

  @override
  String toString() =>
      'SyncAssetV1(checksum=$checksum, createdAt=$createdAt, deletedAt=$deletedAt, duration=$duration, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, height=$height, id=$id, isEdited=$isEdited, isFavorite=$isFavorite, libraryId=$libraryId, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, originalFileName=$originalFileName, ownerId=$ownerId, stackId=$stackId, thumbhash=$thumbhash, type=$type, visibility=$visibility, width=$width)';
}
