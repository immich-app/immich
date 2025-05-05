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
    this.id = const [],
    this.isArchived = const [],
    this.isFavorite = const [],
    this.isImage = const [],
    this.isTrashed = const [],
    this.livePhotoVideoId = const [],
    this.localDateTime = const [],
    this.ownerId = const [],
    this.projectionType = const [],
    this.ratio = const [],
    this.stack = const [],
    this.thumbhash = const [],
  });

  List<String> city;

  List<String> country;

  List<String> duration;

  List<String> id;

  List<num> isArchived;

  List<num> isFavorite;

  List<num> isImage;

  List<num> isTrashed;

  List<String> livePhotoVideoId;

  List<String> localDateTime;

  List<String> ownerId;

  List<String> projectionType;

  List<num> ratio;

  /// (stack ID, stack asset count) tuple
  List<List<String>> stack;

  List<String> thumbhash;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TimeBucketAssetResponseDto &&
    _deepEquality.equals(other.city, city) &&
    _deepEquality.equals(other.country, country) &&
    _deepEquality.equals(other.duration, duration) &&
    _deepEquality.equals(other.id, id) &&
    _deepEquality.equals(other.isArchived, isArchived) &&
    _deepEquality.equals(other.isFavorite, isFavorite) &&
    _deepEquality.equals(other.isImage, isImage) &&
    _deepEquality.equals(other.isTrashed, isTrashed) &&
    _deepEquality.equals(other.livePhotoVideoId, livePhotoVideoId) &&
    _deepEquality.equals(other.localDateTime, localDateTime) &&
    _deepEquality.equals(other.ownerId, ownerId) &&
    _deepEquality.equals(other.projectionType, projectionType) &&
    _deepEquality.equals(other.ratio, ratio) &&
    _deepEquality.equals(other.stack, stack) &&
    _deepEquality.equals(other.thumbhash, thumbhash);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city.hashCode) +
    (country.hashCode) +
    (duration.hashCode) +
    (id.hashCode) +
    (isArchived.hashCode) +
    (isFavorite.hashCode) +
    (isImage.hashCode) +
    (isTrashed.hashCode) +
    (livePhotoVideoId.hashCode) +
    (localDateTime.hashCode) +
    (ownerId.hashCode) +
    (projectionType.hashCode) +
    (ratio.hashCode) +
    (stack.hashCode) +
    (thumbhash.hashCode);

  @override
  String toString() => 'TimeBucketAssetResponseDto[city=$city, country=$country, duration=$duration, id=$id, isArchived=$isArchived, isFavorite=$isFavorite, isImage=$isImage, isTrashed=$isTrashed, livePhotoVideoId=$livePhotoVideoId, localDateTime=$localDateTime, ownerId=$ownerId, projectionType=$projectionType, ratio=$ratio, stack=$stack, thumbhash=$thumbhash]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'city'] = this.city;
      json[r'country'] = this.country;
      json[r'duration'] = this.duration;
      json[r'id'] = this.id;
      json[r'isArchived'] = this.isArchived;
      json[r'isFavorite'] = this.isFavorite;
      json[r'isImage'] = this.isImage;
      json[r'isTrashed'] = this.isTrashed;
      json[r'livePhotoVideoId'] = this.livePhotoVideoId;
      json[r'localDateTime'] = this.localDateTime;
      json[r'ownerId'] = this.ownerId;
      json[r'projectionType'] = this.projectionType;
      json[r'ratio'] = this.ratio;
      json[r'stack'] = this.stack;
      json[r'thumbhash'] = this.thumbhash;
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
        id: json[r'id'] is Iterable
            ? (json[r'id'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        isArchived: json[r'isArchived'] is Iterable
            ? (json[r'isArchived'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        isFavorite: json[r'isFavorite'] is Iterable
            ? (json[r'isFavorite'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        isImage: json[r'isImage'] is Iterable
            ? (json[r'isImage'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        isTrashed: json[r'isTrashed'] is Iterable
            ? (json[r'isTrashed'] as Iterable).cast<num>().toList(growable: false)
            : const [],
        livePhotoVideoId: json[r'livePhotoVideoId'] is Iterable
            ? (json[r'livePhotoVideoId'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        localDateTime: json[r'localDateTime'] is Iterable
            ? (json[r'localDateTime'] as Iterable).cast<String>().toList(growable: false)
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
    'id',
    'isArchived',
    'isFavorite',
    'isImage',
    'isTrashed',
    'livePhotoVideoId',
    'localDateTime',
    'ownerId',
    'projectionType',
    'ratio',
    'thumbhash',
  };
}

