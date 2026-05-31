// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetMediaCreateDto {
  const AssetMediaCreateDto({
    required this.assetData,
    this.duration,
    required this.fileCreatedAt,
    required this.fileModifiedAt,
    this.filename,
    this.isFavorite,
    this.livePhotoVideoId,
    this.metadata,
    this.sidecarData,
    this.visibility,
  });

  /// Asset file data
  final MultipartFile assetData;

  /// Duration in milliseconds (for videos)
  final int? duration;

  /// File creation date
  final DateTime fileCreatedAt;

  /// File modification date
  final DateTime fileModifiedAt;

  /// Filename
  final String? filename;

  /// Mark as favorite
  final bool? isFavorite;

  /// Live photo video ID
  final String? livePhotoVideoId;

  /// Asset metadata items
  final List<AssetMetadataUpsertItemDto>? metadata;

  /// Sidecar file data
  final MultipartFile? sidecarData;

  final AssetVisibility? visibility;

  static const _undefined = Object();

  static AssetMediaCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetMediaCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      assetData: (json[r'assetData'] as MultipartFile?)!,
      duration: (json[r'duration'] as int?),
      fileCreatedAt: DateTime.parse(json[r'fileCreatedAt'] as String),
      fileModifiedAt: DateTime.parse(json[r'fileModifiedAt'] as String),
      filename: (json[r'filename'] as String?),
      isFavorite: (json[r'isFavorite'] as bool?),
      livePhotoVideoId: (json[r'livePhotoVideoId'] as String?),
      metadata: (json[r'metadata'] as List?)
          ?.map(($e) => (AssetMetadataUpsertItemDto.fromJson($e))!)
          .toList(growable: false),
      sidecarData: (json[r'sidecarData'] as MultipartFile?),
      visibility: AssetVisibility.fromJson(json[r'visibility']),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'assetData'] = assetData;
    if (duration != null) {
      json[r'duration'] = duration!;
    }
    json[r'fileCreatedAt'] = fileCreatedAt.toUtc().toIso8601String();
    json[r'fileModifiedAt'] = fileModifiedAt.toUtc().toIso8601String();
    if (filename != null) {
      json[r'filename'] = filename!;
    }
    if (isFavorite != null) {
      json[r'isFavorite'] = isFavorite!;
    }
    if (livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = livePhotoVideoId!;
    }
    if (metadata != null) {
      json[r'metadata'] = metadata!.map(($e) => $e.toJson()).toList(growable: false);
    }
    if (sidecarData != null) {
      json[r'sidecarData'] = sidecarData!;
    }
    if (visibility != null) {
      json[r'visibility'] = visibility!.toJson();
    }
    return json;
  }

  AssetMediaCreateDto copyWith({
    MultipartFile? assetData,
    Object? duration = _undefined,
    DateTime? fileCreatedAt,
    DateTime? fileModifiedAt,
    Object? filename = _undefined,
    Object? isFavorite = _undefined,
    Object? livePhotoVideoId = _undefined,
    Object? metadata = _undefined,
    Object? sidecarData = _undefined,
    Object? visibility = _undefined,
  }) {
    return .new(
      assetData: assetData ?? this.assetData,
      duration: identical(duration, _undefined) ? this.duration : duration as int?,
      fileCreatedAt: fileCreatedAt ?? this.fileCreatedAt,
      fileModifiedAt: fileModifiedAt ?? this.fileModifiedAt,
      filename: identical(filename, _undefined) ? this.filename : filename as String?,
      isFavorite: identical(isFavorite, _undefined) ? this.isFavorite : isFavorite as bool?,
      livePhotoVideoId: identical(livePhotoVideoId, _undefined) ? this.livePhotoVideoId : livePhotoVideoId as String?,
      metadata: identical(metadata, _undefined) ? this.metadata : metadata as List<AssetMetadataUpsertItemDto>?,
      sidecarData: identical(sidecarData, _undefined) ? this.sidecarData : sidecarData as MultipartFile?,
      visibility: identical(visibility, _undefined) ? this.visibility : visibility as AssetVisibility?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetMediaCreateDto &&
            assetData == other.assetData &&
            duration == other.duration &&
            fileCreatedAt == other.fileCreatedAt &&
            fileModifiedAt == other.fileModifiedAt &&
            filename == other.filename &&
            isFavorite == other.isFavorite &&
            livePhotoVideoId == other.livePhotoVideoId &&
            const DeepCollectionEquality().equals(metadata, other.metadata) &&
            sidecarData == other.sidecarData &&
            visibility == other.visibility);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      assetData,
      duration,
      fileCreatedAt,
      fileModifiedAt,
      filename,
      isFavorite,
      livePhotoVideoId,
      const DeepCollectionEquality().hash(metadata),
      sidecarData,
      visibility,
    ]);
  }

  @override
  String toString() =>
      'AssetMediaCreateDto(assetData=$assetData, duration=$duration, fileCreatedAt=$fileCreatedAt, fileModifiedAt=$fileModifiedAt, filename=$filename, isFavorite=$isFavorite, livePhotoVideoId=$livePhotoVideoId, metadata=$metadata, sidecarData=$sidecarData, visibility=$visibility)';
}
