//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SmartSearchDto {
  /// Returns a new [SmartSearchDto] instance.
  SmartSearchDto({
    this.albumIds = const Optional.present(const []),
    this.city = const Optional.absent(),
    this.country = const Optional.absent(),
    this.createdAfter = const Optional.absent(),
    this.createdBefore = const Optional.absent(),
    this.cursor = const Optional.absent(),
    this.filter = const Optional.absent(),
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
    this.personIds = const Optional.present(const []),
    this.query = const Optional.absent(),
    this.queryAssetId = const Optional.absent(),
    this.rating = const Optional.absent(),
    this.size = const Optional.absent(),
    this.state = const Optional.absent(),
    this.tagIds = const Optional.present(const []),
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
  Optional<List<String>?> albumIds;

  /// Filter by city name
  Optional<String?> city;

  /// Filter by country name
  Optional<String?> country;

  /// Filter by creation date (after)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateTime?> createdAfter;

  /// Filter by creation date (before)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateTime?> createdBefore;

  /// Cursor for the next page of results
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> cursor;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<SearchFilter?> filter;

  /// Filter by encoded status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isEncoded;

  /// Filter by favorite status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isFavorite;

  /// Filter by motion photo status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isMotion;

  /// Filter assets not in any album
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isNotInAlbum;

  /// Filter by offline status
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isOffline;

  /// Search language code
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> language;

  /// Filter by lens model
  Optional<String?> lensModel;

  /// Library ID to filter by
  Optional<String?> libraryId;

  /// Filter by camera make
  Optional<String?> make;

  /// Filter by camera model
  Optional<String?> model;

  /// Filter by OCR text content
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> ocr;

  /// Page number
  ///
  /// Minimum value: 1
  /// Maximum value: 9007199254740991
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<int?> page;

  /// Filter by person IDs
  Optional<List<String>?> personIds;

  /// Natural language search query
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> query;

  /// Asset ID to use as search reference
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> queryAssetId;

  /// Filter by rating [1-5], or null for unrated
  ///
  /// Minimum value: 1
  /// Maximum value: 5
  Optional<int?> rating;

  /// Number of results to return
  ///
  /// Minimum value: 1
  /// Maximum value: 1000
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<int?> size;

  /// Filter by state/province name
  Optional<String?> state;

  /// Filter by tag IDs
  Optional<List<String>?> tagIds;

  /// Filter by taken date (after)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateTime?> takenAfter;

  /// Filter by taken date (before)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateTime?> takenBefore;

  /// Filter by trash date (after)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateTime?> trashedAfter;

  /// Filter by trash date (before)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateTime?> trashedBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<AssetTypeEnum?> type;

  /// Filter by update date (after)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateTime?> updatedAfter;

  /// Filter by update date (before)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateTime?> updatedBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<AssetVisibility?> visibility;

  /// Include deleted assets
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> withDeleted;

  /// Include EXIF data in response
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> withExif;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SmartSearchDto &&
    _deepEquality.equals(other.albumIds, albumIds) &&
    other.city == city &&
    other.country == country &&
    other.createdAfter == createdAfter &&
    other.createdBefore == createdBefore &&
    other.cursor == cursor &&
    other.filter == filter &&
    other.isEncoded == isEncoded &&
    other.isFavorite == isFavorite &&
    other.isMotion == isMotion &&
    other.isNotInAlbum == isNotInAlbum &&
    other.isOffline == isOffline &&
    other.language == language &&
    other.lensModel == lensModel &&
    other.libraryId == libraryId &&
    other.make == make &&
    other.model == model &&
    other.ocr == ocr &&
    other.page == page &&
    _deepEquality.equals(other.personIds, personIds) &&
    other.query == query &&
    other.queryAssetId == queryAssetId &&
    other.rating == rating &&
    other.size == size &&
    other.state == state &&
    _deepEquality.equals(other.tagIds, tagIds) &&
    other.takenAfter == takenAfter &&
    other.takenBefore == takenBefore &&
    other.trashedAfter == trashedAfter &&
    other.trashedBefore == trashedBefore &&
    other.type == type &&
    other.updatedAfter == updatedAfter &&
    other.updatedBefore == updatedBefore &&
    other.visibility == visibility &&
    other.withDeleted == withDeleted &&
    other.withExif == withExif;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumIds.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (createdAfter == null ? 0 : createdAfter!.hashCode) +
    (createdBefore == null ? 0 : createdBefore!.hashCode) +
    (cursor == null ? 0 : cursor!.hashCode) +
    (filter == null ? 0 : filter!.hashCode) +
    (isEncoded == null ? 0 : isEncoded!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isMotion == null ? 0 : isMotion!.hashCode) +
    (isNotInAlbum == null ? 0 : isNotInAlbum!.hashCode) +
    (isOffline == null ? 0 : isOffline!.hashCode) +
    (language == null ? 0 : language!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (libraryId == null ? 0 : libraryId!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (ocr == null ? 0 : ocr!.hashCode) +
    (page == null ? 0 : page!.hashCode) +
    (personIds.hashCode) +
    (query == null ? 0 : query!.hashCode) +
    (queryAssetId == null ? 0 : queryAssetId!.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (size == null ? 0 : size!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (tagIds == null ? 0 : tagIds!.hashCode) +
    (takenAfter == null ? 0 : takenAfter!.hashCode) +
    (takenBefore == null ? 0 : takenBefore!.hashCode) +
    (trashedAfter == null ? 0 : trashedAfter!.hashCode) +
    (trashedBefore == null ? 0 : trashedBefore!.hashCode) +
    (type == null ? 0 : type!.hashCode) +
    (updatedAfter == null ? 0 : updatedAfter!.hashCode) +
    (updatedBefore == null ? 0 : updatedBefore!.hashCode) +
    (visibility == null ? 0 : visibility!.hashCode) +
    (withDeleted == null ? 0 : withDeleted!.hashCode) +
    (withExif == null ? 0 : withExif!.hashCode);

  @override
  String toString() => 'SmartSearchDto[albumIds=$albumIds, city=$city, country=$country, createdAfter=$createdAfter, createdBefore=$createdBefore, cursor=$cursor, filter=$filter, isEncoded=$isEncoded, isFavorite=$isFavorite, isMotion=$isMotion, isNotInAlbum=$isNotInAlbum, isOffline=$isOffline, language=$language, lensModel=$lensModel, libraryId=$libraryId, make=$make, model=$model, ocr=$ocr, page=$page, personIds=$personIds, query=$query, queryAssetId=$queryAssetId, rating=$rating, size=$size, state=$state, tagIds=$tagIds, takenAfter=$takenAfter, takenBefore=$takenBefore, trashedAfter=$trashedAfter, trashedBefore=$trashedBefore, type=$type, updatedAfter=$updatedAfter, updatedBefore=$updatedBefore, visibility=$visibility, withDeleted=$withDeleted, withExif=$withExif]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.albumIds.isPresent) {
      final value = this.albumIds.value;
      json[r'albumIds'] = value;
    }
    if (this.city.isPresent) {
      final value = this.city.value;
      json[r'city'] = value;
    }
    if (this.country.isPresent) {
      final value = this.country.value;
      json[r'country'] = value;
    }
    if (this.createdAfter.isPresent) {
      final value = this.createdAfter.value;
      json[r'createdAfter'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.createdBefore.isPresent) {
      final value = this.createdBefore.value;
      json[r'createdBefore'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.cursor.isPresent) {
      final value = this.cursor.value;
      json[r'cursor'] = value;
    }
    if (this.filter.isPresent) {
      final value = this.filter.value;
      json[r'filter'] = value;
    }
    if (this.isEncoded.isPresent) {
      final value = this.isEncoded.value;
      json[r'isEncoded'] = value;
    }
    if (this.isFavorite.isPresent) {
      final value = this.isFavorite.value;
      json[r'isFavorite'] = value;
    }
    if (this.isMotion.isPresent) {
      final value = this.isMotion.value;
      json[r'isMotion'] = value;
    }
    if (this.isNotInAlbum.isPresent) {
      final value = this.isNotInAlbum.value;
      json[r'isNotInAlbum'] = value;
    }
    if (this.isOffline.isPresent) {
      final value = this.isOffline.value;
      json[r'isOffline'] = value;
    }
    if (this.language.isPresent) {
      final value = this.language.value;
      json[r'language'] = value;
    }
    if (this.lensModel.isPresent) {
      final value = this.lensModel.value;
      json[r'lensModel'] = value;
    }
    if (this.libraryId.isPresent) {
      final value = this.libraryId.value;
      json[r'libraryId'] = value;
    }
    if (this.make.isPresent) {
      final value = this.make.value;
      json[r'make'] = value;
    }
    if (this.model.isPresent) {
      final value = this.model.value;
      json[r'model'] = value;
    }
    if (this.ocr.isPresent) {
      final value = this.ocr.value;
      json[r'ocr'] = value;
    }
    if (this.page.isPresent) {
      final value = this.page.value;
      json[r'page'] = value;
    }
    if (this.personIds.isPresent) {
      final value = this.personIds.value;
      json[r'personIds'] = value;
    }
    if (this.query.isPresent) {
      final value = this.query.value;
      json[r'query'] = value;
    }
    if (this.queryAssetId.isPresent) {
      final value = this.queryAssetId.value;
      json[r'queryAssetId'] = value;
    }
    if (this.rating.isPresent) {
      final value = this.rating.value;
      json[r'rating'] = value;
    }
    if (this.size.isPresent) {
      final value = this.size.value;
      json[r'size'] = value;
    }
    if (this.state.isPresent) {
      final value = this.state.value;
      json[r'state'] = value;
    }
    if (this.tagIds.isPresent) {
      final value = this.tagIds.value;
      json[r'tagIds'] = value;
    }
    if (this.takenAfter.isPresent) {
      final value = this.takenAfter.value;
      json[r'takenAfter'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.takenBefore.isPresent) {
      final value = this.takenBefore.value;
      json[r'takenBefore'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.trashedAfter.isPresent) {
      final value = this.trashedAfter.value;
      json[r'trashedAfter'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.trashedBefore.isPresent) {
      final value = this.trashedBefore.value;
      json[r'trashedBefore'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.type.isPresent) {
      final value = this.type.value;
      json[r'type'] = value;
    }
    if (this.updatedAfter.isPresent) {
      final value = this.updatedAfter.value;
      json[r'updatedAfter'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.updatedBefore.isPresent) {
      final value = this.updatedBefore.value;
      json[r'updatedBefore'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
    if (this.visibility.isPresent) {
      final value = this.visibility.value;
      json[r'visibility'] = value;
    }
    if (this.withDeleted.isPresent) {
      final value = this.withDeleted.value;
      json[r'withDeleted'] = value;
    }
    if (this.withExif.isPresent) {
      final value = this.withExif.value;
      json[r'withExif'] = value;
    }
    return json;
  }

  /// Returns a new [SmartSearchDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SmartSearchDto? fromJson(dynamic value) {
    upgradeDto(value, "SmartSearchDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SmartSearchDto(
        albumIds: json.containsKey(r'albumIds') ? Optional.present(json[r'albumIds'] is Iterable
            ? (json[r'albumIds'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        city: json.containsKey(r'city') ? Optional.present(mapValueOfType<String>(json, r'city')) : const Optional.absent(),
        country: json.containsKey(r'country') ? Optional.present(mapValueOfType<String>(json, r'country')) : const Optional.absent(),
        createdAfter: json.containsKey(r'createdAfter') ? Optional.present(mapDateTime(json, r'createdAfter', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        createdBefore: json.containsKey(r'createdBefore') ? Optional.present(mapDateTime(json, r'createdBefore', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        cursor: json.containsKey(r'cursor') ? Optional.present(mapValueOfType<String>(json, r'cursor')) : const Optional.absent(),
        filter: json.containsKey(r'filter') ? Optional.present(SearchFilter.fromJson(json[r'filter'])) : const Optional.absent(),
        isEncoded: json.containsKey(r'isEncoded') ? Optional.present(mapValueOfType<bool>(json, r'isEncoded')) : const Optional.absent(),
        isFavorite: json.containsKey(r'isFavorite') ? Optional.present(mapValueOfType<bool>(json, r'isFavorite')) : const Optional.absent(),
        isMotion: json.containsKey(r'isMotion') ? Optional.present(mapValueOfType<bool>(json, r'isMotion')) : const Optional.absent(),
        isNotInAlbum: json.containsKey(r'isNotInAlbum') ? Optional.present(mapValueOfType<bool>(json, r'isNotInAlbum')) : const Optional.absent(),
        isOffline: json.containsKey(r'isOffline') ? Optional.present(mapValueOfType<bool>(json, r'isOffline')) : const Optional.absent(),
        language: json.containsKey(r'language') ? Optional.present(mapValueOfType<String>(json, r'language')) : const Optional.absent(),
        lensModel: json.containsKey(r'lensModel') ? Optional.present(mapValueOfType<String>(json, r'lensModel')) : const Optional.absent(),
        libraryId: json.containsKey(r'libraryId') ? Optional.present(mapValueOfType<String>(json, r'libraryId')) : const Optional.absent(),
        make: json.containsKey(r'make') ? Optional.present(mapValueOfType<String>(json, r'make')) : const Optional.absent(),
        model: json.containsKey(r'model') ? Optional.present(mapValueOfType<String>(json, r'model')) : const Optional.absent(),
        ocr: json.containsKey(r'ocr') ? Optional.present(mapValueOfType<String>(json, r'ocr')) : const Optional.absent(),
        page: json.containsKey(r'page') ? Optional.present(json[r'page'] == null ? null : int.parse('${json[r'page']}')) : const Optional.absent(),
        personIds: json.containsKey(r'personIds') ? Optional.present(json[r'personIds'] is Iterable
            ? (json[r'personIds'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        query: json.containsKey(r'query') ? Optional.present(mapValueOfType<String>(json, r'query')) : const Optional.absent(),
        queryAssetId: json.containsKey(r'queryAssetId') ? Optional.present(mapValueOfType<String>(json, r'queryAssetId')) : const Optional.absent(),
        rating: json.containsKey(r'rating') ? Optional.present(json[r'rating'] == null ? null : int.parse('${json[r'rating']}')) : const Optional.absent(),
        size: json.containsKey(r'size') ? Optional.present(json[r'size'] == null ? null : int.parse('${json[r'size']}')) : const Optional.absent(),
        state: json.containsKey(r'state') ? Optional.present(mapValueOfType<String>(json, r'state')) : const Optional.absent(),
        tagIds: json.containsKey(r'tagIds') ? Optional.present(json[r'tagIds'] is Iterable
            ? (json[r'tagIds'] as Iterable).cast<String>().toList(growable: false)
            : const []) : const Optional.absent(),
        takenAfter: json.containsKey(r'takenAfter') ? Optional.present(mapDateTime(json, r'takenAfter', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        takenBefore: json.containsKey(r'takenBefore') ? Optional.present(mapDateTime(json, r'takenBefore', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        trashedAfter: json.containsKey(r'trashedAfter') ? Optional.present(mapDateTime(json, r'trashedAfter', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        trashedBefore: json.containsKey(r'trashedBefore') ? Optional.present(mapDateTime(json, r'trashedBefore', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        type: json.containsKey(r'type') ? Optional.present(AssetTypeEnum.fromJson(json[r'type'])) : const Optional.absent(),
        updatedAfter: json.containsKey(r'updatedAfter') ? Optional.present(mapDateTime(json, r'updatedAfter', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        updatedBefore: json.containsKey(r'updatedBefore') ? Optional.present(mapDateTime(json, r'updatedBefore', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        visibility: json.containsKey(r'visibility') ? Optional.present(AssetVisibility.fromJson(json[r'visibility'])) : const Optional.absent(),
        withDeleted: json.containsKey(r'withDeleted') ? Optional.present(mapValueOfType<bool>(json, r'withDeleted')) : const Optional.absent(),
        withExif: json.containsKey(r'withExif') ? Optional.present(mapValueOfType<bool>(json, r'withExif')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<SmartSearchDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SmartSearchDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SmartSearchDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SmartSearchDto> mapFromJson(dynamic json) {
    final map = <String, SmartSearchDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SmartSearchDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SmartSearchDto-objects as value to a dart map
  static Map<String, List<SmartSearchDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SmartSearchDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SmartSearchDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

