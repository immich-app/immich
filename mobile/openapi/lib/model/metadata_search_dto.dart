// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MetadataSearchDto {
  const MetadataSearchDto({
    this.albumIds = const Optional.absent(),
    this.checksum = const Optional.absent(),
    this.city = const Optional.absent(),
    this.country = const Optional.absent(),
    this.createdAfter = const Optional.absent(),
    this.createdBefore = const Optional.absent(),
    this.description = const Optional.absent(),
    this.encodedVideoPath = const Optional.absent(),
    this.id = const Optional.absent(),
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
    this.order = const Optional.absent(),
    this.originalFileName = const Optional.absent(),
    this.originalPath = const Optional.absent(),
    this.page = const Optional.absent(),
    this.personIds = const Optional.absent(),
    this.previewPath = const Optional.absent(),
    this.rating = const Optional.absent(),
    this.size = const Optional.absent(),
    this.state = const Optional.absent(),
    this.tagIds = const Optional.absent(),
    this.takenAfter = const Optional.absent(),
    this.takenBefore = const Optional.absent(),
    this.thumbnailPath = const Optional.absent(),
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

  /// Filter by file checksum
  final Optional<String> checksum;

  /// Filter by city name
  final Optional<String?> city;

  /// Filter by country name
  final Optional<String?> country;

  /// Filter by creation date (after)
  final Optional<DateTime> createdAfter;

  /// Filter by creation date (before)
  final Optional<DateTime> createdBefore;

  /// Filter by description text
  final Optional<String> description;

  /// Filter by encoded video file path
  final Optional<String> encodedVideoPath;

  /// Filter by asset ID
  final Optional<String> id;

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

  /// Sort order
  final Optional<AssetOrder> order;

  /// Filter by original file name
  final Optional<String> originalFileName;

  /// Filter by original file path
  final Optional<String> originalPath;

  /// Page number
  final Optional<int> page;

  /// Filter by person IDs
  final Optional<List<String>> personIds;

  /// Filter by preview file path
  final Optional<String> previewPath;

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

  /// Filter by thumbnail file path
  final Optional<String> thumbnailPath;

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

  static MetadataSearchDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MetadataSearchDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumIds: json.containsKey(r'albumIds')
          ? Optional.present(((json[r'albumIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      checksum: json.containsKey(r'checksum') ? Optional.present(json[r'checksum'] as String) : const Optional.absent(),
      city: json.containsKey(r'city') ? Optional.present((json[r'city'] as String?)) : const Optional.absent(),
      country: json.containsKey(r'country') ? Optional.present((json[r'country'] as String?)) : const Optional.absent(),
      createdAfter: json.containsKey(r'createdAfter')
          ? Optional.present(DateTime.parse(json[r'createdAfter'] as String))
          : const Optional.absent(),
      createdBefore: json.containsKey(r'createdBefore')
          ? Optional.present(DateTime.parse(json[r'createdBefore'] as String))
          : const Optional.absent(),
      description: json.containsKey(r'description')
          ? Optional.present(json[r'description'] as String)
          : const Optional.absent(),
      encodedVideoPath: json.containsKey(r'encodedVideoPath')
          ? Optional.present(json[r'encodedVideoPath'] as String)
          : const Optional.absent(),
      id: json.containsKey(r'id') ? Optional.present(json[r'id'] as String) : const Optional.absent(),
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
      order: json.containsKey(r'order')
          ? Optional.present((AssetOrder.fromJson(json[r'order']))!)
          : const Optional.absent(),
      originalFileName: json.containsKey(r'originalFileName')
          ? Optional.present(json[r'originalFileName'] as String)
          : const Optional.absent(),
      originalPath: json.containsKey(r'originalPath')
          ? Optional.present(json[r'originalPath'] as String)
          : const Optional.absent(),
      page: json.containsKey(r'page') ? Optional.present(json[r'page'] as int) : const Optional.absent(),
      personIds: json.containsKey(r'personIds')
          ? Optional.present(((json[r'personIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      previewPath: json.containsKey(r'previewPath')
          ? Optional.present(json[r'previewPath'] as String)
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
      thumbnailPath: json.containsKey(r'thumbnailPath')
          ? Optional.present(json[r'thumbnailPath'] as String)
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
    if (checksum case Present(:final value)) {
      json[r'checksum'] = value;
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
    if (description case Present(:final value)) {
      json[r'description'] = value;
    }
    if (encodedVideoPath case Present(:final value)) {
      json[r'encodedVideoPath'] = value;
    }
    if (id case Present(:final value)) {
      json[r'id'] = value;
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
    if (order case Present(:final value)) {
      json[r'order'] = value.toJson();
    }
    if (originalFileName case Present(:final value)) {
      json[r'originalFileName'] = value;
    }
    if (originalPath case Present(:final value)) {
      json[r'originalPath'] = value;
    }
    if (page case Present(:final value)) {
      json[r'page'] = value;
    }
    if (personIds case Present(:final value)) {
      json[r'personIds'] = value;
    }
    if (previewPath case Present(:final value)) {
      json[r'previewPath'] = value;
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
    if (thumbnailPath case Present(:final value)) {
      json[r'thumbnailPath'] = value;
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

  MetadataSearchDto copyWith({
    Optional<List<String>>? albumIds,
    Optional<String>? checksum,
    Optional<String?>? city,
    Optional<String?>? country,
    Optional<DateTime>? createdAfter,
    Optional<DateTime>? createdBefore,
    Optional<String>? description,
    Optional<String>? encodedVideoPath,
    Optional<String>? id,
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
    Optional<AssetOrder>? order,
    Optional<String>? originalFileName,
    Optional<String>? originalPath,
    Optional<int>? page,
    Optional<List<String>>? personIds,
    Optional<String>? previewPath,
    Optional<int?>? rating,
    Optional<int>? size,
    Optional<String?>? state,
    Optional<List<String>?>? tagIds,
    Optional<DateTime>? takenAfter,
    Optional<DateTime>? takenBefore,
    Optional<String>? thumbnailPath,
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
      checksum: checksum ?? this.checksum,
      city: city ?? this.city,
      country: country ?? this.country,
      createdAfter: createdAfter ?? this.createdAfter,
      createdBefore: createdBefore ?? this.createdBefore,
      description: description ?? this.description,
      encodedVideoPath: encodedVideoPath ?? this.encodedVideoPath,
      id: id ?? this.id,
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
      order: order ?? this.order,
      originalFileName: originalFileName ?? this.originalFileName,
      originalPath: originalPath ?? this.originalPath,
      page: page ?? this.page,
      personIds: personIds ?? this.personIds,
      previewPath: previewPath ?? this.previewPath,
      rating: rating ?? this.rating,
      size: size ?? this.size,
      state: state ?? this.state,
      tagIds: tagIds ?? this.tagIds,
      takenAfter: takenAfter ?? this.takenAfter,
      takenBefore: takenBefore ?? this.takenBefore,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
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
        (other is MetadataSearchDto &&
            albumIds == other.albumIds &&
            checksum == other.checksum &&
            city == other.city &&
            country == other.country &&
            createdAfter == other.createdAfter &&
            createdBefore == other.createdBefore &&
            description == other.description &&
            encodedVideoPath == other.encodedVideoPath &&
            id == other.id &&
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
            order == other.order &&
            originalFileName == other.originalFileName &&
            originalPath == other.originalPath &&
            page == other.page &&
            personIds == other.personIds &&
            previewPath == other.previewPath &&
            rating == other.rating &&
            size == other.size &&
            state == other.state &&
            tagIds == other.tagIds &&
            takenAfter == other.takenAfter &&
            takenBefore == other.takenBefore &&
            thumbnailPath == other.thumbnailPath &&
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
      checksum,
      city,
      country,
      createdAfter,
      createdBefore,
      description,
      encodedVideoPath,
      id,
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
      order,
      originalFileName,
      originalPath,
      page,
      personIds,
      previewPath,
      rating,
      size,
      state,
      tagIds,
      takenAfter,
      takenBefore,
      thumbnailPath,
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
      'MetadataSearchDto(albumIds=$albumIds, checksum=$checksum, city=$city, country=$country, createdAfter=$createdAfter, createdBefore=$createdBefore, description=$description, encodedVideoPath=$encodedVideoPath, id=$id, isEncoded=$isEncoded, isFavorite=$isFavorite, isMotion=$isMotion, isNotInAlbum=$isNotInAlbum, isOffline=$isOffline, lensModel=$lensModel, libraryId=$libraryId, make=$make, model=$model, ocr=$ocr, order=$order, originalFileName=$originalFileName, originalPath=$originalPath, page=$page, personIds=$personIds, previewPath=$previewPath, rating=$rating, size=$size, state=$state, tagIds=$tagIds, takenAfter=$takenAfter, takenBefore=$takenBefore, thumbnailPath=$thumbnailPath, trashedAfter=$trashedAfter, trashedBefore=$trashedBefore, type=$type, updatedAfter=$updatedAfter, updatedBefore=$updatedBefore, visibility=$visibility, withDeleted=$withDeleted, withExif=$withExif, withPeople=$withPeople, withStacked=$withStacked)';
}
