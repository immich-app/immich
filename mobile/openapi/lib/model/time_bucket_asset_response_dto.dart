//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TimeBucketAssetResponseDto {
  /// Returns a new [TimeBucketAssetResponseDto] instance.
  TimeBucketAssetResponseDto({
    this.city = const [],
    this.country = const [],
    this.duration = const [],
    this.fileCreatedAt = const [],
    this.id = const [],
    this.isFavorite = const [],
    this.isImage = const [],
    this.isTrashed = const [],
    this.latitude = const [],
    this.livePhotoVideoId = const [],
    this.localOffsetHours = const [],
    this.longitude = const [],
    this.ownerId = const [],
    this.projectionType = const [],
    this.ratio = const [],
    this.stack = const [],
    this.thumbhash = const [],
    this.visibility = const [],
  });

  /// Array of city names extracted from EXIF GPS data
  List<String?> city;

  /// Array of country names extracted from EXIF GPS data
  List<String?> country;

  /// Array of video durations in HH:MM:SS format (null for images)
  List<String?> duration;

  /// Array of file creation timestamps in UTC (ISO 8601 format, without timezone)
  List<String> fileCreatedAt;

  /// Array of asset IDs in the time bucket
  List<String> id;

  /// Array indicating whether each asset is favorited
  List<bool> isFavorite;

  /// Array indicating whether each asset is an image (false for videos)
  List<bool> isImage;

  /// Array indicating whether each asset is in the trash
  List<bool> isTrashed;

  /// Array of latitude coordinates extracted from EXIF GPS data
  List<num?> latitude;

  /// Array of live photo video asset IDs (null for non-live photos)
  List<String?> livePhotoVideoId;

  /// Array of UTC offset hours at the time each photo was taken. Positive values are east of UTC, negative values are west of UTC. Values may be fractional (e.g., 5.5 for +05:30, -9.75 for -09:45). Applying this offset to 'fileCreatedAt' will give you the time the photo was taken from the photographer's perspective.
  List<num> localOffsetHours;

  /// Array of longitude coordinates extracted from EXIF GPS data
  List<num?> longitude;

  /// Array of owner IDs for each asset
  List<String> ownerId;

  /// Array of projection types for 360° content (e.g., \"EQUIRECTANGULAR\", \"CUBEFACE\", \"CYLINDRICAL\")
  List<String?> projectionType;

  /// Array of aspect ratios (width/height) for each asset
  List<num> ratio;

  /// Array of stack information as [stackId, assetCount] tuples (null for non-stacked assets)
  List<List<String>?> stack;

  /// Array of BlurHash strings for generating asset previews (base64 encoded)
  List<String?> thumbhash;

  /// Array of visibility statuses for each asset (e.g., ARCHIVE, TIMELINE, HIDDEN, LOCKED)
  List<AssetVisibility> visibility;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TimeBucketAssetResponseDto &&
    _deepEquality.equals(other.city, city) &&
    _deepEquality.equals(other.country, country) &&
    _deepEquality.equals(other.duration, duration) &&
    _deepEquality.equals(other.fileCreatedAt, fileCreatedAt) &&
    _deepEquality.equals(other.id, id) &&
    _deepEquality.equals(other.isFavorite, isFavorite) &&
    _deepEquality.equals(other.isImage, isImage) &&
    _deepEquality.equals(other.isTrashed, isTrashed) &&
    _deepEquality.equals(other.latitude, latitude) &&
    _deepEquality.equals(other.livePhotoVideoId, livePhotoVideoId) &&
    _deepEquality.equals(other.localOffsetHours, localOffsetHours) &&
    _deepEquality.equals(other.longitude, longitude) &&
    _deepEquality.equals(other.ownerId, ownerId) &&
    _deepEquality.equals(other.projectionType, projectionType) &&
    _deepEquality.equals(other.ratio, ratio) &&
    _deepEquality.equals(other.stack, stack) &&
    _deepEquality.equals(other.thumbhash, thumbhash) &&
    _deepEquality.equals(other.visibility, visibility);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city.hashCode) +
    (country.hashCode) +
    (duration.hashCode) +
    (fileCreatedAt.hashCode) +
    (id.hashCode) +
    (isFavorite.hashCode) +
    (isImage.hashCode) +
    (isTrashed.hashCode) +
    (latitude.hashCode) +
    (livePhotoVideoId.hashCode) +
    (localOffsetHours.hashCode) +
    (longitude.hashCode) +
    (ownerId.hashCode) +
    (projectionType.hashCode) +
    (ratio.hashCode) +
    (stack.hashCode) +
    (thumbhash.hashCode) +
    (visibility.hashCode);

  @override
  String toString() => 'TimeBucketAssetResponseDto[city=$city, country=$country, duration=$duration, fileCreatedAt=$fileCreatedAt, id=$id, isFavorite=$isFavorite, isImage=$isImage, isTrashed=$isTrashed, latitude=$latitude, livePhotoVideoId=$livePhotoVideoId, localOffsetHours=$localOffsetHours, longitude=$longitude, ownerId=$ownerId, projectionType=$projectionType, ratio=$ratio, stack=$stack, thumbhash=$thumbhash, visibility=$visibility]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'city'] = this.city;
      json[r'country'] = this.country;
      json[r'duration'] = this.duration;
      json[r'fileCreatedAt'] = this.fileCreatedAt;
      json[r'id'] = this.id;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isImage'] = this.isImage;
      json[r'isTrashed'] = this.isTrashed;
      json[r'latitude'] = this.latitude;
      json[r'livePhotoVideoId'] = this.livePhotoVideoId;
      json[r'localOffsetHours'] = this.localOffsetHours;
      json[r'longitude'] = this.longitude;
      json[r'ownerId'] = this.ownerId;
      json[r'projectionType'] = this.projectionType;
      json[r'ratio'] = this.ratio;
      json[r'stack'] = this.stack;
      json[r'thumbhash'] = this.thumbhash;
      json[r'visibility'] = this.visibility;
    return json;
  }

  /// Returns a new [TimeBucketAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TimeBucketAssetResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "TimeBucketAssetResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TimeBucketAssetResponseDto(
        city: json[r'city'] is Iterable
            ? (json[r'city'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        country: json[r'country'] is Iterable
            ? (json[r'country'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        duration: json[r'duration'] is Iterable
            ? (json[r'duration'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        fileCreatedAt: json[r'fileCreatedAt'] is Iterable
            ? (json[r'fileCreatedAt'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        id: json[r'id'] is Iterable
            ? (json[r'id'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        isFavorite: json[r'isFavorite'] is Iterable
            ? (json[r'isFavorite'] as Iterable).cast<bool>().toList(growable: false)
            : const [],
        isImage: json[r'isImage'] is Iterable
            ? (json[r'isImage'] as Iterable).cast<bool>().toList(growable: false)
            : const [],
        isTrashed: json[r'isTrashed'] is Iterable
            ? (json[r'isTrashed'] as Iterable).cast<bool>().toList(growable: false)
            : const [],
        latitude: json[r'latitude'] is Iterable
            ? (json[r'latitude'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        livePhotoVideoId: json[r'livePhotoVideoId'] is Iterable
            ? (json[r'livePhotoVideoId'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        localOffsetHours: json[r'localOffsetHours'] is Iterable
            ? (json[r'localOffsetHours'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        longitude: json[r'longitude'] is Iterable
            ? (json[r'longitude'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        ownerId: json[r'ownerId'] is Iterable
            ? (json[r'ownerId'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        projectionType: json[r'projectionType'] is Iterable
            ? (json[r'projectionType'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        ratio: json[r'ratio'] is Iterable
            ? (json[r'ratio'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        stack: json[r'stack'] is List
          ? (json[r'stack'] as List).map((e) =>
              e == null ? null : (e as List).cast<String>()
            ).toList()
          :  const [],
        thumbhash: json[r'thumbhash'] is Iterable
            ? (json[r'thumbhash'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        visibility: AssetVisibility.listFromJson(json[r'visibility']),
      );
    }
    return null;
  }

  static List<TimeBucketAssetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TimeBucketAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TimeBucketAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TimeBucketAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, TimeBucketAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TimeBucketAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TimeBucketAssetResponseDto-objects as value to a dart map
  static Map<String, List<TimeBucketAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TimeBucketAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TimeBucketAssetResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'city',
    'country',
    'duration',
    'fileCreatedAt',
    'id',
    'isFavorite',
    'isImage',
    'isTrashed',
    'livePhotoVideoId',
    'localOffsetHours',
    'ownerId',
    'projectionType',
    'ratio',
    'thumbhash',
    'visibility',
  };
}

