//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchFilterBranch {
  /// Returns a new [SearchFilterBranch] instance.
  SearchFilterBranch({
    this.albumIds = const Optional.absent(),
    this.checksum = const Optional.absent(),
    this.city = const Optional.absent(),
    this.country = const Optional.absent(),
    this.createdAt = const Optional.absent(),
    this.description = const Optional.absent(),
    this.encodedVideoPath = const Optional.absent(),
    this.fileSizeInBytes = const Optional.absent(),
    this.hasAlbums = const Optional.absent(),
    this.hasPeople = const Optional.absent(),
    this.hasTags = const Optional.absent(),
    this.id = const Optional.absent(),
    this.isEncoded = const Optional.absent(),
    this.isFavorite = const Optional.absent(),
    this.isMotion = const Optional.absent(),
    this.isOffline = const Optional.absent(),
    this.lensModel = const Optional.absent(),
    this.libraryId = const Optional.absent(),
    this.make = const Optional.absent(),
    this.model = const Optional.absent(),
    this.ocr = const Optional.absent(),
    this.originalFileName = const Optional.absent(),
    this.originalPath = const Optional.absent(),
    this.personIds = const Optional.absent(),
    this.rating = const Optional.absent(),
    this.state = const Optional.absent(),
    this.tagIds = const Optional.absent(),
    this.takenAt = const Optional.absent(),
    this.trashedAt = const Optional.absent(),
    this.type = const Optional.absent(),
    this.updatedAt = const Optional.absent(),
    this.visibility = const Optional.absent(),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<IdsFilter?> albumIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringFilter?> checksum;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringFilterNullable?> city;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringFilterNullable?> country;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateFilter?> createdAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringPatternFilter?> description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringFilter?> encodedVideoPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<NumberFilter?> fileSizeInBytes;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<BoolFilter?> hasAlbums;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<BoolFilter?> hasPeople;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<BoolFilter?> hasTags;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<IdFilter?> id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<BoolFilter?> isEncoded;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<BoolFilter?> isFavorite;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<BoolFilter?> isMotion;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<BoolFilter?> isOffline;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringFilterNullable?> lensModel;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<IdFilterNullable?> libraryId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringFilterNullable?> make;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringFilterNullable?> model;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringSimilarityFilter?> ocr;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringPatternFilter?> originalFileName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringPatternFilter?> originalPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<IdsFilter?> personIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<NumberFilterNullable?> rating;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<StringFilterNullable?> state;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<IdsFilter?> tagIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateFilter?> takenAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateFilterNullable?> trashedAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<EnumFilterAssetType?> type;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<DateFilter?> updatedAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<EnumFilterAssetVisibility?> visibility;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchFilterBranch &&
    other.albumIds == albumIds &&
    other.checksum == checksum &&
    other.city == city &&
    other.country == country &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.encodedVideoPath == encodedVideoPath &&
    other.fileSizeInBytes == fileSizeInBytes &&
    other.hasAlbums == hasAlbums &&
    other.hasPeople == hasPeople &&
    other.hasTags == hasTags &&
    other.id == id &&
    other.isEncoded == isEncoded &&
    other.isFavorite == isFavorite &&
    other.isMotion == isMotion &&
    other.isOffline == isOffline &&
    other.lensModel == lensModel &&
    other.libraryId == libraryId &&
    other.make == make &&
    other.model == model &&
    other.ocr == ocr &&
    other.originalFileName == originalFileName &&
    other.originalPath == originalPath &&
    other.personIds == personIds &&
    other.rating == rating &&
    other.state == state &&
    other.tagIds == tagIds &&
    other.takenAt == takenAt &&
    other.trashedAt == trashedAt &&
    other.type == type &&
    other.updatedAt == updatedAt &&
    other.visibility == visibility;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumIds == null ? 0 : albumIds!.hashCode) +
    (checksum == null ? 0 : checksum!.hashCode) +
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (createdAt == null ? 0 : createdAt!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (encodedVideoPath == null ? 0 : encodedVideoPath!.hashCode) +
    (fileSizeInBytes == null ? 0 : fileSizeInBytes!.hashCode) +
    (hasAlbums == null ? 0 : hasAlbums!.hashCode) +
    (hasPeople == null ? 0 : hasPeople!.hashCode) +
    (hasTags == null ? 0 : hasTags!.hashCode) +
    (id == null ? 0 : id!.hashCode) +
    (isEncoded == null ? 0 : isEncoded!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isMotion == null ? 0 : isMotion!.hashCode) +
    (isOffline == null ? 0 : isOffline!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (libraryId == null ? 0 : libraryId!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (ocr == null ? 0 : ocr!.hashCode) +
    (originalFileName == null ? 0 : originalFileName!.hashCode) +
    (originalPath == null ? 0 : originalPath!.hashCode) +
    (personIds == null ? 0 : personIds!.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (tagIds == null ? 0 : tagIds!.hashCode) +
    (takenAt == null ? 0 : takenAt!.hashCode) +
    (trashedAt == null ? 0 : trashedAt!.hashCode) +
    (type == null ? 0 : type!.hashCode) +
    (updatedAt == null ? 0 : updatedAt!.hashCode) +
    (visibility == null ? 0 : visibility!.hashCode);

  @override
  String toString() => 'SearchFilterBranch[albumIds=$albumIds, checksum=$checksum, city=$city, country=$country, createdAt=$createdAt, description=$description, encodedVideoPath=$encodedVideoPath, fileSizeInBytes=$fileSizeInBytes, hasAlbums=$hasAlbums, hasPeople=$hasPeople, hasTags=$hasTags, id=$id, isEncoded=$isEncoded, isFavorite=$isFavorite, isMotion=$isMotion, isOffline=$isOffline, lensModel=$lensModel, libraryId=$libraryId, make=$make, model=$model, ocr=$ocr, originalFileName=$originalFileName, originalPath=$originalPath, personIds=$personIds, rating=$rating, state=$state, tagIds=$tagIds, takenAt=$takenAt, trashedAt=$trashedAt, type=$type, updatedAt=$updatedAt, visibility=$visibility]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.albumIds.isPresent) {
      final value = this.albumIds.value;
      json[r'albumIds'] = value;
    }
    if (this.checksum.isPresent) {
      final value = this.checksum.value;
      json[r'checksum'] = value;
    }
    if (this.city.isPresent) {
      final value = this.city.value;
      json[r'city'] = value;
    }
    if (this.country.isPresent) {
      final value = this.country.value;
      json[r'country'] = value;
    }
    if (this.createdAt.isPresent) {
      final value = this.createdAt.value;
      json[r'createdAt'] = value;
    }
    if (this.description.isPresent) {
      final value = this.description.value;
      json[r'description'] = value;
    }
    if (this.encodedVideoPath.isPresent) {
      final value = this.encodedVideoPath.value;
      json[r'encodedVideoPath'] = value;
    }
    if (this.fileSizeInBytes.isPresent) {
      final value = this.fileSizeInBytes.value;
      json[r'fileSizeInBytes'] = value;
    }
    if (this.hasAlbums.isPresent) {
      final value = this.hasAlbums.value;
      json[r'hasAlbums'] = value;
    }
    if (this.hasPeople.isPresent) {
      final value = this.hasPeople.value;
      json[r'hasPeople'] = value;
    }
    if (this.hasTags.isPresent) {
      final value = this.hasTags.value;
      json[r'hasTags'] = value;
    }
    if (this.id.isPresent) {
      final value = this.id.value;
      json[r'id'] = value;
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
    if (this.isOffline.isPresent) {
      final value = this.isOffline.value;
      json[r'isOffline'] = value;
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
    if (this.originalFileName.isPresent) {
      final value = this.originalFileName.value;
      json[r'originalFileName'] = value;
    }
    if (this.originalPath.isPresent) {
      final value = this.originalPath.value;
      json[r'originalPath'] = value;
    }
    if (this.personIds.isPresent) {
      final value = this.personIds.value;
      json[r'personIds'] = value;
    }
    if (this.rating.isPresent) {
      final value = this.rating.value;
      json[r'rating'] = value;
    }
    if (this.state.isPresent) {
      final value = this.state.value;
      json[r'state'] = value;
    }
    if (this.tagIds.isPresent) {
      final value = this.tagIds.value;
      json[r'tagIds'] = value;
    }
    if (this.takenAt.isPresent) {
      final value = this.takenAt.value;
      json[r'takenAt'] = value;
    }
    if (this.trashedAt.isPresent) {
      final value = this.trashedAt.value;
      json[r'trashedAt'] = value;
    }
    if (this.type.isPresent) {
      final value = this.type.value;
      json[r'type'] = value;
    }
    if (this.updatedAt.isPresent) {
      final value = this.updatedAt.value;
      json[r'updatedAt'] = value;
    }
    if (this.visibility.isPresent) {
      final value = this.visibility.value;
      json[r'visibility'] = value;
    }
    return json;
  }

  /// Returns a new [SearchFilterBranch] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchFilterBranch? fromJson(dynamic value) {
    upgradeDto(value, "SearchFilterBranch");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SearchFilterBranch(
        albumIds: json.containsKey(r'albumIds') ? Optional.present(IdsFilter.fromJson(json[r'albumIds'])) : const Optional.absent(),
        checksum: json.containsKey(r'checksum') ? Optional.present(StringFilter.fromJson(json[r'checksum'])) : const Optional.absent(),
        city: json.containsKey(r'city') ? Optional.present(StringFilterNullable.fromJson(json[r'city'])) : const Optional.absent(),
        country: json.containsKey(r'country') ? Optional.present(StringFilterNullable.fromJson(json[r'country'])) : const Optional.absent(),
        createdAt: json.containsKey(r'createdAt') ? Optional.present(DateFilter.fromJson(json[r'createdAt'])) : const Optional.absent(),
        description: json.containsKey(r'description') ? Optional.present(StringPatternFilter.fromJson(json[r'description'])) : const Optional.absent(),
        encodedVideoPath: json.containsKey(r'encodedVideoPath') ? Optional.present(StringFilter.fromJson(json[r'encodedVideoPath'])) : const Optional.absent(),
        fileSizeInBytes: json.containsKey(r'fileSizeInBytes') ? Optional.present(NumberFilter.fromJson(json[r'fileSizeInBytes'])) : const Optional.absent(),
        hasAlbums: json.containsKey(r'hasAlbums') ? Optional.present(BoolFilter.fromJson(json[r'hasAlbums'])) : const Optional.absent(),
        hasPeople: json.containsKey(r'hasPeople') ? Optional.present(BoolFilter.fromJson(json[r'hasPeople'])) : const Optional.absent(),
        hasTags: json.containsKey(r'hasTags') ? Optional.present(BoolFilter.fromJson(json[r'hasTags'])) : const Optional.absent(),
        id: json.containsKey(r'id') ? Optional.present(IdFilter.fromJson(json[r'id'])) : const Optional.absent(),
        isEncoded: json.containsKey(r'isEncoded') ? Optional.present(BoolFilter.fromJson(json[r'isEncoded'])) : const Optional.absent(),
        isFavorite: json.containsKey(r'isFavorite') ? Optional.present(BoolFilter.fromJson(json[r'isFavorite'])) : const Optional.absent(),
        isMotion: json.containsKey(r'isMotion') ? Optional.present(BoolFilter.fromJson(json[r'isMotion'])) : const Optional.absent(),
        isOffline: json.containsKey(r'isOffline') ? Optional.present(BoolFilter.fromJson(json[r'isOffline'])) : const Optional.absent(),
        lensModel: json.containsKey(r'lensModel') ? Optional.present(StringFilterNullable.fromJson(json[r'lensModel'])) : const Optional.absent(),
        libraryId: json.containsKey(r'libraryId') ? Optional.present(IdFilterNullable.fromJson(json[r'libraryId'])) : const Optional.absent(),
        make: json.containsKey(r'make') ? Optional.present(StringFilterNullable.fromJson(json[r'make'])) : const Optional.absent(),
        model: json.containsKey(r'model') ? Optional.present(StringFilterNullable.fromJson(json[r'model'])) : const Optional.absent(),
        ocr: json.containsKey(r'ocr') ? Optional.present(StringSimilarityFilter.fromJson(json[r'ocr'])) : const Optional.absent(),
        originalFileName: json.containsKey(r'originalFileName') ? Optional.present(StringPatternFilter.fromJson(json[r'originalFileName'])) : const Optional.absent(),
        originalPath: json.containsKey(r'originalPath') ? Optional.present(StringPatternFilter.fromJson(json[r'originalPath'])) : const Optional.absent(),
        personIds: json.containsKey(r'personIds') ? Optional.present(IdsFilter.fromJson(json[r'personIds'])) : const Optional.absent(),
        rating: json.containsKey(r'rating') ? Optional.present(NumberFilterNullable.fromJson(json[r'rating'])) : const Optional.absent(),
        state: json.containsKey(r'state') ? Optional.present(StringFilterNullable.fromJson(json[r'state'])) : const Optional.absent(),
        tagIds: json.containsKey(r'tagIds') ? Optional.present(IdsFilter.fromJson(json[r'tagIds'])) : const Optional.absent(),
        takenAt: json.containsKey(r'takenAt') ? Optional.present(DateFilter.fromJson(json[r'takenAt'])) : const Optional.absent(),
        trashedAt: json.containsKey(r'trashedAt') ? Optional.present(DateFilterNullable.fromJson(json[r'trashedAt'])) : const Optional.absent(),
        type: json.containsKey(r'type') ? Optional.present(EnumFilterAssetType.fromJson(json[r'type'])) : const Optional.absent(),
        updatedAt: json.containsKey(r'updatedAt') ? Optional.present(DateFilter.fromJson(json[r'updatedAt'])) : const Optional.absent(),
        visibility: json.containsKey(r'visibility') ? Optional.present(EnumFilterAssetVisibility.fromJson(json[r'visibility'])) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<SearchFilterBranch> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchFilterBranch>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchFilterBranch.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchFilterBranch> mapFromJson(dynamic json) {
    final map = <String, SearchFilterBranch>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchFilterBranch.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchFilterBranch-objects as value to a dart map
  static Map<String, List<SearchFilterBranch>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchFilterBranch>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchFilterBranch.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

