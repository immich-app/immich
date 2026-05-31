// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class TimeBucketAssetResponseDto {
  const TimeBucketAssetResponseDto({
    this.city,
    this.country,
    required this.createdAt,
    required this.duration,
    required this.fileCreatedAt,
    required this.id,
    required this.isFavorite,
    required this.isImage,
    required this.isTrashed,
    this.latitude,
    required this.livePhotoVideoId,
    required this.localOffsetHours,
    this.longitude,
    required this.ownerId,
    required this.projectionType,
    required this.ratio,
    this.stack,
    required this.thumbhash,
    required this.visibility,
  });

  /// Array of city names extracted from EXIF GPS data
  final List<String?>? city;

  /// Array of country names extracted from EXIF GPS data
  final List<String?>? country;

  /// Array of UTC timestamps when each asset was originally uploaded to Immich
  final List<String> createdAt;

  /// Array of video/gif durations in milliseconds (null for static images)
  final List<int?> duration;

  /// Array of file creation timestamps in UTC
  final List<String> fileCreatedAt;

  /// Array of asset IDs in the time bucket
  final List<String> id;

  /// Array indicating whether each asset is favorited
  final List<bool> isFavorite;

  /// Array indicating whether each asset is an image (false for videos)
  final List<bool> isImage;

  /// Array indicating whether each asset is in the trash
  final List<bool> isTrashed;

  /// Array of latitude coordinates extracted from EXIF GPS data
  final List<double?>? latitude;

  /// Array of live photo video asset IDs (null for non-live photos)
  final List<String?> livePhotoVideoId;

  /// Array of UTC offset hours at the time each photo was taken. Positive values are east of UTC, negative values are west of UTC. Values may be fractional (e.g., 5.5 for +05:30, -9.75 for -09:45). Applying this offset to 'fileCreatedAt' will give you the time the photo was taken from the photographer's perspective.
  final List<double> localOffsetHours;

  /// Array of longitude coordinates extracted from EXIF GPS data
  final List<double?>? longitude;

  /// Array of owner IDs for each asset
  final List<String> ownerId;

  /// Array of projection types for 360° content (e.g., "EQUIRECTANGULAR", "CUBEFACE", "CYLINDRICAL")
  final List<String?> projectionType;

  /// Array of aspect ratios (width/height) for each asset
  final List<double> ratio;

  /// Array of stack information as [stackId, assetCount] tuples (null for non-stacked assets)
  final List<List<String>?>? stack;

  /// Array of BlurHash strings for generating asset previews (base64 encoded)
  final List<String?> thumbhash;

  /// Array of visibility statuses for each asset (e.g., ARCHIVE, TIMELINE, HIDDEN, LOCKED)
  final List<AssetVisibility> visibility;

  static const _undefined = Object();

  static TimeBucketAssetResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<TimeBucketAssetResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      city: (json[r'city'] as List?)?.map(($e) => ($e as String?)).toList(growable: false),
      country: (json[r'country'] as List?)?.map(($e) => ($e as String?)).toList(growable: false),
      createdAt: ((json[r'createdAt'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      duration: ((json[r'duration'] as List?)?.map(($e) => ($e as int?)).toList(growable: false))!,
      fileCreatedAt: ((json[r'fileCreatedAt'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      id: ((json[r'id'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      isFavorite: ((json[r'isFavorite'] as List?)?.map(($e) => $e as bool).toList(growable: false))!,
      isImage: ((json[r'isImage'] as List?)?.map(($e) => $e as bool).toList(growable: false))!,
      isTrashed: ((json[r'isTrashed'] as List?)?.map(($e) => $e as bool).toList(growable: false))!,
      latitude: (json[r'latitude'] as List?)?.map(($e) => ($e as num?)?.toDouble()).toList(growable: false),
      livePhotoVideoId: ((json[r'livePhotoVideoId'] as List?)?.map(($e) => ($e as String?)).toList(growable: false))!,
      localOffsetHours: ((json[r'localOffsetHours'] as List?)
          ?.map(($e) => ($e as num).toDouble())
          .toList(growable: false))!,
      longitude: (json[r'longitude'] as List?)?.map(($e) => ($e as num?)?.toDouble()).toList(growable: false),
      ownerId: ((json[r'ownerId'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      projectionType: ((json[r'projectionType'] as List?)?.map(($e) => ($e as String?)).toList(growable: false))!,
      ratio: ((json[r'ratio'] as List?)?.map(($e) => ($e as num).toDouble()).toList(growable: false))!,
      stack: (json[r'stack'] as List?)
          ?.map(($e) => ($e as List?)?.map(($e) => $e as String).toList(growable: false))
          .toList(growable: false),
      thumbhash: ((json[r'thumbhash'] as List?)?.map(($e) => ($e as String?)).toList(growable: false))!,
      visibility: ((json[r'visibility'] as List?)
          ?.map(($e) => (AssetVisibility.fromJson($e))!)
          .toList(growable: false))!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (city != null) {
      json[r'city'] = city!;
    }
    if (country != null) {
      json[r'country'] = country!;
    }
    json[r'createdAt'] = createdAt;
    json[r'duration'] = duration;
    json[r'fileCreatedAt'] = fileCreatedAt;
    json[r'id'] = id;
    json[r'isFavorite'] = isFavorite;
    json[r'isImage'] = isImage;
    json[r'isTrashed'] = isTrashed;
    if (latitude != null) {
      json[r'latitude'] = latitude!;
    }
    json[r'livePhotoVideoId'] = livePhotoVideoId;
    json[r'localOffsetHours'] = localOffsetHours;
    if (longitude != null) {
      json[r'longitude'] = longitude!;
    }
    json[r'ownerId'] = ownerId;
    json[r'projectionType'] = projectionType;
    json[r'ratio'] = ratio;
    if (stack != null) {
      json[r'stack'] = stack!;
    }
    json[r'thumbhash'] = thumbhash;
    json[r'visibility'] = visibility.map(($e) => $e.toJson()).toList(growable: false);
    return json;
  }

  TimeBucketAssetResponseDto copyWith({
    Object? city = _undefined,
    Object? country = _undefined,
    List<String>? createdAt,
    List<int?>? duration,
    List<String>? fileCreatedAt,
    List<String>? id,
    List<bool>? isFavorite,
    List<bool>? isImage,
    List<bool>? isTrashed,
    Object? latitude = _undefined,
    List<String?>? livePhotoVideoId,
    List<double>? localOffsetHours,
    Object? longitude = _undefined,
    List<String>? ownerId,
    List<String?>? projectionType,
    List<double>? ratio,
    Object? stack = _undefined,
    List<String?>? thumbhash,
    List<AssetVisibility>? visibility,
  }) {
    return .new(
      city: identical(city, _undefined) ? this.city : city as List<String?>?,
      country: identical(country, _undefined) ? this.country : country as List<String?>?,
      createdAt: createdAt ?? this.createdAt,
      duration: duration ?? this.duration,
      fileCreatedAt: fileCreatedAt ?? this.fileCreatedAt,
      id: id ?? this.id,
      isFavorite: isFavorite ?? this.isFavorite,
      isImage: isImage ?? this.isImage,
      isTrashed: isTrashed ?? this.isTrashed,
      latitude: identical(latitude, _undefined) ? this.latitude : latitude as List<double?>?,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
      localOffsetHours: localOffsetHours ?? this.localOffsetHours,
      longitude: identical(longitude, _undefined) ? this.longitude : longitude as List<double?>?,
      ownerId: ownerId ?? this.ownerId,
      projectionType: projectionType ?? this.projectionType,
      ratio: ratio ?? this.ratio,
      stack: identical(stack, _undefined) ? this.stack : stack as List<List<String>?>?,
      thumbhash: thumbhash ?? this.thumbhash,
      visibility: visibility ?? this.visibility,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is TimeBucketAssetResponseDto &&
            const DeepCollectionEquality().equals(city, other.city) &&
            const DeepCollectionEquality().equals(country, other.country) &&
            const DeepCollectionEquality().equals(createdAt, other.createdAt) &&
            const DeepCollectionEquality().equals(duration, other.duration) &&
            const DeepCollectionEquality().equals(fileCreatedAt, other.fileCreatedAt) &&
            const DeepCollectionEquality().equals(id, other.id) &&
            const DeepCollectionEquality().equals(isFavorite, other.isFavorite) &&
            const DeepCollectionEquality().equals(isImage, other.isImage) &&
            const DeepCollectionEquality().equals(isTrashed, other.isTrashed) &&
            const DeepCollectionEquality().equals(latitude, other.latitude) &&
            const DeepCollectionEquality().equals(livePhotoVideoId, other.livePhotoVideoId) &&
            const DeepCollectionEquality().equals(localOffsetHours, other.localOffsetHours) &&
            const DeepCollectionEquality().equals(longitude, other.longitude) &&
            const DeepCollectionEquality().equals(ownerId, other.ownerId) &&
            const DeepCollectionEquality().equals(projectionType, other.projectionType) &&
            const DeepCollectionEquality().equals(ratio, other.ratio) &&
            const DeepCollectionEquality().equals(stack, other.stack) &&
            const DeepCollectionEquality().equals(thumbhash, other.thumbhash) &&
            const DeepCollectionEquality().equals(visibility, other.visibility));
  }

  @override
  int get hashCode {
    return Object.hashAll([
      const DeepCollectionEquality().hash(city),
      const DeepCollectionEquality().hash(country),
      const DeepCollectionEquality().hash(createdAt),
      const DeepCollectionEquality().hash(duration),
      const DeepCollectionEquality().hash(fileCreatedAt),
      const DeepCollectionEquality().hash(id),
      const DeepCollectionEquality().hash(isFavorite),
      const DeepCollectionEquality().hash(isImage),
      const DeepCollectionEquality().hash(isTrashed),
      const DeepCollectionEquality().hash(latitude),
      const DeepCollectionEquality().hash(livePhotoVideoId),
      const DeepCollectionEquality().hash(localOffsetHours),
      const DeepCollectionEquality().hash(longitude),
      const DeepCollectionEquality().hash(ownerId),
      const DeepCollectionEquality().hash(projectionType),
      const DeepCollectionEquality().hash(ratio),
      const DeepCollectionEquality().hash(stack),
      const DeepCollectionEquality().hash(thumbhash),
      const DeepCollectionEquality().hash(visibility),
    ]);
  }

  @override
  String toString() =>
      'TimeBucketAssetResponseDto(city=$city, country=$country, createdAt=$createdAt, duration=$duration, fileCreatedAt=$fileCreatedAt, id=$id, isFavorite=$isFavorite, isImage=$isImage, isTrashed=$isTrashed, latitude=$latitude, livePhotoVideoId=$livePhotoVideoId, localOffsetHours=$localOffsetHours, longitude=$longitude, ownerId=$ownerId, projectionType=$projectionType, ratio=$ratio, stack=$stack, thumbhash=$thumbhash, visibility=$visibility)';
}
