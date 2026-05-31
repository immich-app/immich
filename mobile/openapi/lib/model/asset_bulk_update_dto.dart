// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class AssetBulkUpdateDto {
  const AssetBulkUpdateDto({
    this.dateTimeOriginal = const Optional.absent(),
    this.dateTimeRelative = const Optional.absent(),
    this.description = const Optional.absent(),
    this.duplicateId = const Optional.absent(),
    required this.ids,
    this.isFavorite = const Optional.absent(),
    this.latitude = const Optional.absent(),
    this.longitude = const Optional.absent(),
    this.rating = const Optional.absent(),
    this.timeZone = const Optional.absent(),
    this.visibility = const Optional.absent(),
  });

  /// Original date and time
  final Optional<String> dateTimeOriginal;

  /// Relative time offset in seconds
  final Optional<int> dateTimeRelative;

  /// Asset description
  final Optional<String> description;

  /// Duplicate ID
  final Optional<String?> duplicateId;

  /// Asset IDs to update
  final List<String> ids;

  /// Mark as favorite
  final Optional<bool> isFavorite;

  /// Latitude coordinate
  final Optional<double> latitude;

  /// Longitude coordinate
  final Optional<double> longitude;

  /// Rating in range [1-5], or null for unrated
  /// Available since server v1.0.0.
  final Optional<int?> rating;

  /// Time zone (IANA timezone)
  final Optional<String> timeZone;

  final Optional<AssetVisibility> visibility;

  static const ApiVersion ratingAddedIn = .new(1, 0, 0);

  static const ApiState ratingState = .stable;

  static AssetBulkUpdateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<AssetBulkUpdateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      dateTimeOriginal: json.containsKey(r'dateTimeOriginal')
          ? Optional.present(json[r'dateTimeOriginal'] as String)
          : const Optional.absent(),
      dateTimeRelative: json.containsKey(r'dateTimeRelative')
          ? Optional.present(json[r'dateTimeRelative'] as int)
          : const Optional.absent(),
      description: json.containsKey(r'description')
          ? Optional.present(json[r'description'] as String)
          : const Optional.absent(),
      duplicateId: json.containsKey(r'duplicateId')
          ? Optional.present((json[r'duplicateId'] as String?))
          : const Optional.absent(),
      ids: ((json[r'ids'] as List?)?.map(($e) => $e as String).toList(growable: false))!,
      isFavorite: json.containsKey(r'isFavorite')
          ? Optional.present(json[r'isFavorite'] as bool)
          : const Optional.absent(),
      latitude: json.containsKey(r'latitude')
          ? Optional.present((json[r'latitude'] as num).toDouble())
          : const Optional.absent(),
      longitude: json.containsKey(r'longitude')
          ? Optional.present((json[r'longitude'] as num).toDouble())
          : const Optional.absent(),
      rating: json.containsKey(r'rating') ? Optional.present((json[r'rating'] as int?)) : const Optional.absent(),
      timeZone: json.containsKey(r'timeZone') ? Optional.present(json[r'timeZone'] as String) : const Optional.absent(),
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
    if (dateTimeRelative case Present(:final value)) {
      json[r'dateTimeRelative'] = value;
    }
    if (description case Present(:final value)) {
      json[r'description'] = value;
    }
    if (duplicateId case Present(:final value)) {
      json[r'duplicateId'] = value;
    }
    json[r'ids'] = ids;
    if (isFavorite case Present(:final value)) {
      json[r'isFavorite'] = value;
    }
    if (latitude case Present(:final value)) {
      json[r'latitude'] = value;
    }
    if (longitude case Present(:final value)) {
      json[r'longitude'] = value;
    }
    if (rating case Present(:final value)) {
      json[r'rating'] = value;
    }
    if (timeZone case Present(:final value)) {
      json[r'timeZone'] = value;
    }
    if (visibility case Present(:final value)) {
      json[r'visibility'] = value.toJson();
    }
    return json;
  }

  AssetBulkUpdateDto copyWith({
    Optional<String>? dateTimeOriginal,
    Optional<int>? dateTimeRelative,
    Optional<String>? description,
    Optional<String?>? duplicateId,
    List<String>? ids,
    Optional<bool>? isFavorite,
    Optional<double>? latitude,
    Optional<double>? longitude,
    Optional<int?>? rating,
    Optional<String>? timeZone,
    Optional<AssetVisibility>? visibility,
  }) {
    return .new(
      dateTimeOriginal: dateTimeOriginal ?? this.dateTimeOriginal,
      dateTimeRelative: dateTimeRelative ?? this.dateTimeRelative,
      description: description ?? this.description,
      duplicateId: duplicateId ?? this.duplicateId,
      ids: ids ?? this.ids,
      isFavorite: isFavorite ?? this.isFavorite,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      rating: rating ?? this.rating,
      timeZone: timeZone ?? this.timeZone,
      visibility: visibility ?? this.visibility,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is AssetBulkUpdateDto &&
            dateTimeOriginal == other.dateTimeOriginal &&
            dateTimeRelative == other.dateTimeRelative &&
            description == other.description &&
            duplicateId == other.duplicateId &&
            const DeepCollectionEquality().equals(ids, other.ids) &&
            isFavorite == other.isFavorite &&
            latitude == other.latitude &&
            longitude == other.longitude &&
            rating == other.rating &&
            timeZone == other.timeZone &&
            visibility == other.visibility);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      dateTimeOriginal,
      dateTimeRelative,
      description,
      duplicateId,
      const DeepCollectionEquality().hash(ids),
      isFavorite,
      latitude,
      longitude,
      rating,
      timeZone,
      visibility,
    ]);
  }

  @override
  String toString() =>
      'AssetBulkUpdateDto(dateTimeOriginal=$dateTimeOriginal, dateTimeRelative=$dateTimeRelative, description=$description, duplicateId=$duplicateId, ids=$ids, isFavorite=$isFavorite, latitude=$latitude, longitude=$longitude, rating=$rating, timeZone=$timeZone, visibility=$visibility)';
}
