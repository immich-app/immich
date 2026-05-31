// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UpdateAssetDto {
  const UpdateAssetDto({
    this.dateTimeOriginal = const Optional.absent(),
    this.description = const Optional.absent(),
    this.isFavorite = const Optional.absent(),
    this.latitude = const Optional.absent(),
    this.livePhotoVideoId = const Optional.absent(),
    this.longitude = const Optional.absent(),
    this.rating = const Optional.absent(),
    this.visibility = const Optional.absent(),
  });

  /// Original date and time
  final Optional<String> dateTimeOriginal;

  /// Asset description
  final Optional<String> description;

  /// Mark as favorite
  final Optional<bool> isFavorite;

  /// Latitude coordinate
  final Optional<double> latitude;

  /// Live photo video ID
  final Optional<String?> livePhotoVideoId;

  /// Longitude coordinate
  final Optional<double> longitude;

  /// Rating in range [1-5], or null for unrated
  /// Available since server v1.0.0.
  final Optional<int?> rating;

  final Optional<AssetVisibility> visibility;

  static const ApiVersion ratingAddedIn = .new(1, 0, 0);

  static const ApiState ratingState = .stable;

  static UpdateAssetDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UpdateAssetDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      dateTimeOriginal: json.containsKey(r'dateTimeOriginal')
          ? Optional.present(json[r'dateTimeOriginal'] as String)
          : const Optional.absent(),
      description: json.containsKey(r'description')
          ? Optional.present(json[r'description'] as String)
          : const Optional.absent(),
      isFavorite: json.containsKey(r'isFavorite')
          ? Optional.present(json[r'isFavorite'] as bool)
          : const Optional.absent(),
      latitude: json.containsKey(r'latitude')
          ? Optional.present((json[r'latitude'] as num).toDouble())
          : const Optional.absent(),
      livePhotoVideoId: json.containsKey(r'livePhotoVideoId')
          ? Optional.present((json[r'livePhotoVideoId'] as String?))
          : const Optional.absent(),
      longitude: json.containsKey(r'longitude')
          ? Optional.present((json[r'longitude'] as num).toDouble())
          : const Optional.absent(),
      rating: json.containsKey(r'rating') ? Optional.present((json[r'rating'] as int?)) : const Optional.absent(),
      visibility: json.containsKey(r'visibility')
          ? Optional.present((AssetVisibility.fromJson(json[r'visibility']))!)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (dateTimeOriginal case Present(:final value)) {
      json[r'dateTimeOriginal'] = value;
    }
    if (description case Present(:final value)) {
      json[r'description'] = value;
    }
    if (isFavorite case Present(:final value)) {
      json[r'isFavorite'] = value;
    }
    if (latitude case Present(:final value)) {
      json[r'latitude'] = value;
    }
    if (livePhotoVideoId case Present(:final value)) {
      json[r'livePhotoVideoId'] = value;
    }
    if (longitude case Present(:final value)) {
      json[r'longitude'] = value;
    }
    if (rating case Present(:final value)) {
      json[r'rating'] = value;
    }
    if (visibility case Present(:final value)) {
      json[r'visibility'] = value.toJson();
    }
    return json;
  }

  UpdateAssetDto copyWith({
    Optional<String>? dateTimeOriginal,
    Optional<String>? description,
    Optional<bool>? isFavorite,
    Optional<double>? latitude,
    Optional<String?>? livePhotoVideoId,
    Optional<double>? longitude,
    Optional<int?>? rating,
    Optional<AssetVisibility>? visibility,
  }) {
    return .new(
      dateTimeOriginal: dateTimeOriginal ?? this.dateTimeOriginal,
      description: description ?? this.description,
      isFavorite: isFavorite ?? this.isFavorite,
      latitude: latitude ?? this.latitude,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
      longitude: longitude ?? this.longitude,
      rating: rating ?? this.rating,
      visibility: visibility ?? this.visibility,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UpdateAssetDto &&
            dateTimeOriginal == other.dateTimeOriginal &&
            description == other.description &&
            isFavorite == other.isFavorite &&
            latitude == other.latitude &&
            livePhotoVideoId == other.livePhotoVideoId &&
            longitude == other.longitude &&
            rating == other.rating &&
            visibility == other.visibility);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      dateTimeOriginal,
      description,
      isFavorite,
      latitude,
      livePhotoVideoId,
      longitude,
      rating,
      visibility,
    ]);
  }

  @override
  String toString() =>
      'UpdateAssetDto(dateTimeOriginal=$dateTimeOriginal, description=$description, isFavorite=$isFavorite, latitude=$latitude, livePhotoVideoId=$livePhotoVideoId, longitude=$longitude, rating=$rating, visibility=$visibility)';
}
