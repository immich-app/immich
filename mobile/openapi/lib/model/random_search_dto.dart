// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class RandomSearchDto {
  const RandomSearchDto({
    this.albumIds = const Optional.absent(),
    this.city = const Optional.absent(),
    this.country = const Optional.absent(),
    this.createdAfter = const Optional.absent(),
    this.createdBefore = const Optional.absent(),
    this.isEncoded = const Optional.absent(),
    this.isFavorite = const Optional.absent(),
    this.isMotion = const Optional.absent(),
    this.isNotInAlbum = const Optional.absent(),
    this.isOffline = const Optional.absent(),
    this.lensModel = const Optional.absent(),
    this.libraryId = const Optional.absent(),
    this.make = const Optional.absent(),
    this.model = const Optional.absent(),
    this.ocr = const Optional.absent(),
    this.personIds = const Optional.absent(),
    this.rating = const Optional.absent(),
    this.size = const Optional.absent(),
    this.state = const Optional.absent(),
    this.tagIds = const Optional.absent(),
    this.takenAfter = const Optional.absent(),
    this.takenBefore = const Optional.absent(),
    this.trashedAfter = const Optional.absent(),
    this.trashedBefore = const Optional.absent(),
    this.type = const Optional.absent(),
    this.updatedAfter = const Optional.absent(),
    this.updatedBefore = const Optional.absent(),
    this.visibility = const Optional.absent(),
    this.withDeleted = const Optional.absent(),
    this.withExif = const Optional.absent(),
    this.withPeople = const Optional.absent(),
    this.withStacked = const Optional.absent(),
  });

  /// Filter by album IDs
  final Optional<List<String>> albumIds;

  /// Filter by city name
  final Optional<String?> city;

  /// Filter by country name
  final Optional<String?> country;

  /// Filter by creation date (after)
  final Optional<DateTime> createdAfter;

  /// Filter by creation date (before)
  final Optional<DateTime> createdBefore;

  /// Filter by encoded status
  final Optional<bool> isEncoded;

  /// Filter by favorite status
  final Optional<bool> isFavorite;

  /// Filter by motion photo status
  final Optional<bool> isMotion;

  /// Filter assets not in any album
  final Optional<bool> isNotInAlbum;

  /// Filter by offline status
  final Optional<bool> isOffline;

  /// Filter by lens model
  final Optional<String?> lensModel;

  /// Library ID to filter by
  final Optional<String?> libraryId;

  /// Filter by camera make
  final Optional<String?> make;

  /// Filter by camera model
  final Optional<String?> model;

  /// Filter by OCR text content
  final Optional<String> ocr;

  /// Filter by person IDs
  final Optional<List<String>> personIds;

  /// Filter by rating [1-5], or null for unrated
  /// Available since server v1.0.0.
  final Optional<int?> rating;

  /// Number of results to return
  final Optional<int> size;

  /// Filter by state/province name
  final Optional<String?> state;

  /// Filter by tag IDs
  final Optional<List<String>?> tagIds;

  /// Filter by taken date (after)
  final Optional<DateTime> takenAfter;

  /// Filter by taken date (before)
  final Optional<DateTime> takenBefore;

  /// Filter by trash date (after)
  final Optional<DateTime> trashedAfter;

  /// Filter by trash date (before)
  final Optional<DateTime> trashedBefore;

  final Optional<AssetTypeEnum> type;

  /// Filter by update date (after)
  final Optional<DateTime> updatedAfter;

  /// Filter by update date (before)
  final Optional<DateTime> updatedBefore;

  final Optional<AssetVisibility> visibility;

  /// Include deleted assets
  final Optional<bool> withDeleted;

  /// Include EXIF data in response
  final Optional<bool> withExif;

  /// Include people data in response
  final Optional<bool> withPeople;

  /// Include stacked assets
  final Optional<bool> withStacked;

  static const ApiVersion ratingAddedIn = .new(1, 0, 0);

  static const ApiState ratingState = .stable;

  static RandomSearchDto? fromJson(dynamic value) {
    ApiCompat.upgrade<RandomSearchDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumIds: json.containsKey(r'albumIds')
          ? Optional.present(((json[r'albumIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      city: json.containsKey(r'city') ? Optional.present((json[r'city'] as String?)) : const Optional.absent(),
      country: json.containsKey(r'country') ? Optional.present((json[r'country'] as String?)) : const Optional.absent(),
      createdAfter: json.containsKey(r'createdAfter')
          ? Optional.present(DateTime.parse(json[r'createdAfter'] as String))
          : const Optional.absent(),
      createdBefore: json.containsKey(r'createdBefore')
          ? Optional.present(DateTime.parse(json[r'createdBefore'] as String))
          : const Optional.absent(),
      isEncoded: json.containsKey(r'isEncoded')
          ? Optional.present(json[r'isEncoded'] as bool)
          : const Optional.absent(),
      isFavorite: json.containsKey(r'isFavorite')
          ? Optional.present(json[r'isFavorite'] as bool)
          : const Optional.absent(),
      isMotion: json.containsKey(r'isMotion') ? Optional.present(json[r'isMotion'] as bool) : const Optional.absent(),
      isNotInAlbum: json.containsKey(r'isNotInAlbum')
          ? Optional.present(json[r'isNotInAlbum'] as bool)
          : const Optional.absent(),
      isOffline: json.containsKey(r'isOffline')
          ? Optional.present(json[r'isOffline'] as bool)
          : const Optional.absent(),
      lensModel: json.containsKey(r'lensModel')
          ? Optional.present((json[r'lensModel'] as String?))
          : const Optional.absent(),
      libraryId: json.containsKey(r'libraryId')
          ? Optional.present((json[r'libraryId'] as String?))
          : const Optional.absent(),
      make: json.containsKey(r'make') ? Optional.present((json[r'make'] as String?)) : const Optional.absent(),
      model: json.containsKey(r'model') ? Optional.present((json[r'model'] as String?)) : const Optional.absent(),
      ocr: json.containsKey(r'ocr') ? Optional.present(json[r'ocr'] as String) : const Optional.absent(),
      personIds: json.containsKey(r'personIds')
          ? Optional.present(((json[r'personIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      rating: json.containsKey(r'rating') ? Optional.present((json[r'rating'] as int?)) : const Optional.absent(),
      size: json.containsKey(r'size') ? Optional.present(json[r'size'] as int) : const Optional.absent(),
      state: json.containsKey(r'state') ? Optional.present((json[r'state'] as String?)) : const Optional.absent(),
      tagIds: json.containsKey(r'tagIds')
          ? Optional.present((json[r'tagIds'] as List?)?.map(($e) => $e as String).toList(growable: false))
          : const Optional.absent(),
      takenAfter: json.containsKey(r'takenAfter')
          ? Optional.present(DateTime.parse(json[r'takenAfter'] as String))
          : const Optional.absent(),
      takenBefore: json.containsKey(r'takenBefore')
          ? Optional.present(DateTime.parse(json[r'takenBefore'] as String))
          : const Optional.absent(),
      trashedAfter: json.containsKey(r'trashedAfter')
          ? Optional.present(DateTime.parse(json[r'trashedAfter'] as String))
          : const Optional.absent(),
      trashedBefore: json.containsKey(r'trashedBefore')
          ? Optional.present(DateTime.parse(json[r'trashedBefore'] as String))
          : const Optional.absent(),
      type: json.containsKey(r'type')
          ? Optional.present((AssetTypeEnum.fromJson(json[r'type']))!)
          : const Optional.absent(),
      updatedAfter: json.containsKey(r'updatedAfter')
          ? Optional.present(DateTime.parse(json[r'updatedAfter'] as String))
          : const Optional.absent(),
      updatedBefore: json.containsKey(r'updatedBefore')
          ? Optional.present(DateTime.parse(json[r'updatedBefore'] as String))
          : const Optional.absent(),
      visibility: json.containsKey(r'visibility')
          ? Optional.present((AssetVisibility.fromJson(json[r'visibility']))!)
          : const Optional.absent(),
      withDeleted: json.containsKey(r'withDeleted')
          ? Optional.present(json[r'withDeleted'] as bool)
          : const Optional.absent(),
      withExif: json.containsKey(r'withExif') ? Optional.present(json[r'withExif'] as bool) : const Optional.absent(),
      withPeople: json.containsKey(r'withPeople')
          ? Optional.present(json[r'withPeople'] as bool)
          : const Optional.absent(),
      withStacked: json.containsKey(r'withStacked')
          ? Optional.present(json[r'withStacked'] as bool)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (albumIds case Present(:final value)) {
      json[r'albumIds'] = value;
    }
    if (city case Present(:final value)) {
      json[r'city'] = value;
    }
    if (country case Present(:final value)) {
      json[r'country'] = value;
    }
    if (createdAfter case Present(:final value)) {
      json[r'createdAfter'] = value.toUtc().toIso8601String();
    }
    if (createdBefore case Present(:final value)) {
      json[r'createdBefore'] = value.toUtc().toIso8601String();
    }
    if (isEncoded case Present(:final value)) {
      json[r'isEncoded'] = value;
    }
    if (isFavorite case Present(:final value)) {
      json[r'isFavorite'] = value;
    }
    if (isMotion case Present(:final value)) {
      json[r'isMotion'] = value;
    }
    if (isNotInAlbum case Present(:final value)) {
      json[r'isNotInAlbum'] = value;
    }
    if (isOffline case Present(:final value)) {
      json[r'isOffline'] = value;
    }
    if (lensModel case Present(:final value)) {
      json[r'lensModel'] = value;
    }
    if (libraryId case Present(:final value)) {
      json[r'libraryId'] = value;
    }
    if (make case Present(:final value)) {
      json[r'make'] = value;
    }
    if (model case Present(:final value)) {
      json[r'model'] = value;
    }
    if (ocr case Present(:final value)) {
      json[r'ocr'] = value;
    }
    if (personIds case Present(:final value)) {
      json[r'personIds'] = value;
    }
    if (rating case Present(:final value)) {
      json[r'rating'] = value;
    }
    if (size case Present(:final value)) {
      json[r'size'] = value;
    }
    if (state case Present(:final value)) {
      json[r'state'] = value;
    }
    if (tagIds case Present(:final value)) {
      json[r'tagIds'] = value;
    }
    if (takenAfter case Present(:final value)) {
      json[r'takenAfter'] = value.toUtc().toIso8601String();
    }
    if (takenBefore case Present(:final value)) {
      json[r'takenBefore'] = value.toUtc().toIso8601String();
    }
    if (trashedAfter case Present(:final value)) {
      json[r'trashedAfter'] = value.toUtc().toIso8601String();
    }
    if (trashedBefore case Present(:final value)) {
      json[r'trashedBefore'] = value.toUtc().toIso8601String();
    }
    if (type case Present(:final value)) {
      json[r'type'] = value.toJson();
    }
    if (updatedAfter case Present(:final value)) {
      json[r'updatedAfter'] = value.toUtc().toIso8601String();
    }
    if (updatedBefore case Present(:final value)) {
      json[r'updatedBefore'] = value.toUtc().toIso8601String();
    }
    if (visibility case Present(:final value)) {
      json[r'visibility'] = value.toJson();
    }
    if (withDeleted case Present(:final value)) {
      json[r'withDeleted'] = value;
    }
    if (withExif case Present(:final value)) {
      json[r'withExif'] = value;
    }
    if (withPeople case Present(:final value)) {
      json[r'withPeople'] = value;
    }
    if (withStacked case Present(:final value)) {
      json[r'withStacked'] = value;
    }
    return json;
  }

  RandomSearchDto copyWith({
    Optional<List<String>>? albumIds,
    Optional<String?>? city,
    Optional<String?>? country,
    Optional<DateTime>? createdAfter,
    Optional<DateTime>? createdBefore,
    Optional<bool>? isEncoded,
    Optional<bool>? isFavorite,
    Optional<bool>? isMotion,
    Optional<bool>? isNotInAlbum,
    Optional<bool>? isOffline,
    Optional<String?>? lensModel,
    Optional<String?>? libraryId,
    Optional<String?>? make,
    Optional<String?>? model,
    Optional<String>? ocr,
    Optional<List<String>>? personIds,
    Optional<int?>? rating,
    Optional<int>? size,
    Optional<String?>? state,
    Optional<List<String>?>? tagIds,
    Optional<DateTime>? takenAfter,
    Optional<DateTime>? takenBefore,
    Optional<DateTime>? trashedAfter,
    Optional<DateTime>? trashedBefore,
    Optional<AssetTypeEnum>? type,
    Optional<DateTime>? updatedAfter,
    Optional<DateTime>? updatedBefore,
    Optional<AssetVisibility>? visibility,
    Optional<bool>? withDeleted,
    Optional<bool>? withExif,
    Optional<bool>? withPeople,
    Optional<bool>? withStacked,
  }) {
    return .new(
      albumIds: albumIds ?? this.albumIds,
      city: city ?? this.city,
      country: country ?? this.country,
      createdAfter: createdAfter ?? this.createdAfter,
      createdBefore: createdBefore ?? this.createdBefore,
      isEncoded: isEncoded ?? this.isEncoded,
      isFavorite: isFavorite ?? this.isFavorite,
      isMotion: isMotion ?? this.isMotion,
      isNotInAlbum: isNotInAlbum ?? this.isNotInAlbum,
      isOffline: isOffline ?? this.isOffline,
      lensModel: lensModel ?? this.lensModel,
      libraryId: libraryId ?? this.libraryId,
      make: make ?? this.make,
      model: model ?? this.model,
      ocr: ocr ?? this.ocr,
      personIds: personIds ?? this.personIds,
      rating: rating ?? this.rating,
      size: size ?? this.size,
      state: state ?? this.state,
      tagIds: tagIds ?? this.tagIds,
      takenAfter: takenAfter ?? this.takenAfter,
      takenBefore: takenBefore ?? this.takenBefore,
      trashedAfter: trashedAfter ?? this.trashedAfter,
      trashedBefore: trashedBefore ?? this.trashedBefore,
      type: type ?? this.type,
      updatedAfter: updatedAfter ?? this.updatedAfter,
      updatedBefore: updatedBefore ?? this.updatedBefore,
      visibility: visibility ?? this.visibility,
      withDeleted: withDeleted ?? this.withDeleted,
      withExif: withExif ?? this.withExif,
      withPeople: withPeople ?? this.withPeople,
      withStacked: withStacked ?? this.withStacked,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is RandomSearchDto &&
            albumIds == other.albumIds &&
            city == other.city &&
            country == other.country &&
            createdAfter == other.createdAfter &&
            createdBefore == other.createdBefore &&
            isEncoded == other.isEncoded &&
            isFavorite == other.isFavorite &&
            isMotion == other.isMotion &&
            isNotInAlbum == other.isNotInAlbum &&
            isOffline == other.isOffline &&
            lensModel == other.lensModel &&
            libraryId == other.libraryId &&
            make == other.make &&
            model == other.model &&
            ocr == other.ocr &&
            personIds == other.personIds &&
            rating == other.rating &&
            size == other.size &&
            state == other.state &&
            tagIds == other.tagIds &&
            takenAfter == other.takenAfter &&
            takenBefore == other.takenBefore &&
            trashedAfter == other.trashedAfter &&
            trashedBefore == other.trashedBefore &&
            type == other.type &&
            updatedAfter == other.updatedAfter &&
            updatedBefore == other.updatedBefore &&
            visibility == other.visibility &&
            withDeleted == other.withDeleted &&
            withExif == other.withExif &&
            withPeople == other.withPeople &&
            withStacked == other.withStacked);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      albumIds,
      city,
      country,
      createdAfter,
      createdBefore,
      isEncoded,
      isFavorite,
      isMotion,
      isNotInAlbum,
      isOffline,
      lensModel,
      libraryId,
      make,
      model,
      ocr,
      personIds,
      rating,
      size,
      state,
      tagIds,
      takenAfter,
      takenBefore,
      trashedAfter,
      trashedBefore,
      type,
      updatedAfter,
      updatedBefore,
      visibility,
      withDeleted,
      withExif,
      withPeople,
      withStacked,
    ]);
  }

  @override
  String toString() =>
      'RandomSearchDto(albumIds=$albumIds, city=$city, country=$country, createdAfter=$createdAfter, createdBefore=$createdBefore, isEncoded=$isEncoded, isFavorite=$isFavorite, isMotion=$isMotion, isNotInAlbum=$isNotInAlbum, isOffline=$isOffline, lensModel=$lensModel, libraryId=$libraryId, make=$make, model=$model, ocr=$ocr, personIds=$personIds, rating=$rating, size=$size, state=$state, tagIds=$tagIds, takenAfter=$takenAfter, takenBefore=$takenBefore, trashedAfter=$trashedAfter, trashedBefore=$trashedBefore, type=$type, updatedAfter=$updatedAfter, updatedBefore=$updatedBefore, visibility=$visibility, withDeleted=$withDeleted, withExif=$withExif, withPeople=$withPeople, withStacked=$withStacked)';
}
