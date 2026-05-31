// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SmartSearchDto {
  const SmartSearchDto({
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
    this.language = const Optional.absent(),
    this.lensModel = const Optional.absent(),
    this.libraryId = const Optional.absent(),
    this.make = const Optional.absent(),
    this.model = const Optional.absent(),
    this.ocr = const Optional.absent(),
    this.page = const Optional.absent(),
    this.personIds = const Optional.absent(),
    this.query = const Optional.absent(),
    this.queryAssetId = const Optional.absent(),
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

  /// Search language code
  final Optional<String> language;

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

  /// Page number
  final Optional<int> page;

  /// Filter by person IDs
  final Optional<List<String>> personIds;

  /// Natural language search query
  final Optional<String> query;

  /// Asset ID to use as search reference
  final Optional<String> queryAssetId;

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

  static const ApiVersion ratingAddedIn = .new(1, 0, 0);

  static const ApiState ratingState = .stable;

  static SmartSearchDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SmartSearchDto>(value);
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
      language: json.containsKey(r'language') ? Optional.present(json[r'language'] as String) : const Optional.absent(),
      lensModel: json.containsKey(r'lensModel')
          ? Optional.present((json[r'lensModel'] as String?))
          : const Optional.absent(),
      libraryId: json.containsKey(r'libraryId')
          ? Optional.present((json[r'libraryId'] as String?))
          : const Optional.absent(),
      make: json.containsKey(r'make') ? Optional.present((json[r'make'] as String?)) : const Optional.absent(),
      model: json.containsKey(r'model') ? Optional.present((json[r'model'] as String?)) : const Optional.absent(),
      ocr: json.containsKey(r'ocr') ? Optional.present(json[r'ocr'] as String) : const Optional.absent(),
      page: json.containsKey(r'page') ? Optional.present(json[r'page'] as int) : const Optional.absent(),
      personIds: json.containsKey(r'personIds')
          ? Optional.present(((json[r'personIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      query: json.containsKey(r'query') ? Optional.present(json[r'query'] as String) : const Optional.absent(),
      queryAssetId: json.containsKey(r'queryAssetId')
          ? Optional.present(json[r'queryAssetId'] as String)
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
    if (language case Present(:final value)) {
      json[r'language'] = value;
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
    if (page case Present(:final value)) {
      json[r'page'] = value;
    }
    if (personIds case Present(:final value)) {
      json[r'personIds'] = value;
    }
    if (query case Present(:final value)) {
      json[r'query'] = value;
    }
    if (queryAssetId case Present(:final value)) {
      json[r'queryAssetId'] = value;
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
    return json;
  }

  SmartSearchDto copyWith({
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
    Optional<String>? language,
    Optional<String?>? lensModel,
    Optional<String?>? libraryId,
    Optional<String?>? make,
    Optional<String?>? model,
    Optional<String>? ocr,
    Optional<int>? page,
    Optional<List<String>>? personIds,
    Optional<String>? query,
    Optional<String>? queryAssetId,
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
      language: language ?? this.language,
      lensModel: lensModel ?? this.lensModel,
      libraryId: libraryId ?? this.libraryId,
      make: make ?? this.make,
      model: model ?? this.model,
      ocr: ocr ?? this.ocr,
      page: page ?? this.page,
      personIds: personIds ?? this.personIds,
      query: query ?? this.query,
      queryAssetId: queryAssetId ?? this.queryAssetId,
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
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SmartSearchDto &&
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
            language == other.language &&
            lensModel == other.lensModel &&
            libraryId == other.libraryId &&
            make == other.make &&
            model == other.model &&
            ocr == other.ocr &&
            page == other.page &&
            personIds == other.personIds &&
            query == other.query &&
            queryAssetId == other.queryAssetId &&
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
            withExif == other.withExif);
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
      language,
      lensModel,
      libraryId,
      make,
      model,
      ocr,
      page,
      personIds,
      query,
      queryAssetId,
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
    ]);
  }

  @override
  String toString() =>
      'SmartSearchDto(albumIds=$albumIds, city=$city, country=$country, createdAfter=$createdAfter, createdBefore=$createdBefore, isEncoded=$isEncoded, isFavorite=$isFavorite, isMotion=$isMotion, isNotInAlbum=$isNotInAlbum, isOffline=$isOffline, language=$language, lensModel=$lensModel, libraryId=$libraryId, make=$make, model=$model, ocr=$ocr, page=$page, personIds=$personIds, query=$query, queryAssetId=$queryAssetId, rating=$rating, size=$size, state=$state, tagIds=$tagIds, takenAfter=$takenAfter, takenBefore=$takenBefore, trashedAfter=$trashedAfter, trashedBefore=$trashedBefore, type=$type, updatedAfter=$updatedAfter, updatedBefore=$updatedBefore, visibility=$visibility, withDeleted=$withDeleted, withExif=$withExif)';
}
