//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MetadataSearchDto {
  /// Returns a new [MetadataSearchDto] instance.
  MetadataSearchDto({
    this.checksum,
    this.city = const None(),
    this.country = const None(),
    this.createdAfter,
    this.createdBefore,
    this.description,
    this.deviceAssetId,
    this.deviceId,
    this.encodedVideoPath,
    this.id,
    this.isEncoded,
    this.isFavorite,
    this.isMotion,
    this.isNotInAlbum,
    this.isOffline,
    this.lensModel = const None(),
    this.libraryId = const None(),
    this.make,
    this.model = const None(),
    this.order = AssetOrder.desc,
    this.originalFileName,
    this.originalPath,
    this.page,
    this.personIds = const [],
    this.previewPath,
    this.rating,
    this.size,
    this.state = const None(),
    this.tagIds = const [],
    this.takenAfter,
    this.takenBefore,
    this.thumbnailPath,
    this.trashedAfter,
    this.trashedBefore,
    this.type,
    this.updatedAfter,
    this.updatedBefore,
    this.visibility,
    this.withDeleted,
    this.withExif,
    this.withPeople,
    this.withStacked,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? checksum;

  Option<String> city;

  Option<String> country;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? createdAfter;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? createdBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? deviceAssetId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? deviceId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? encodedVideoPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isEncoded;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isMotion;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isNotInAlbum;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isOffline;

  Option<String> lensModel;

  Option<String> libraryId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? make;

  Option<String> model;

  AssetOrder order;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? originalFileName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? originalPath;

  /// Minimum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? page;

  List<String> personIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? previewPath;

  /// Minimum value: -1
  /// Maximum value: 5
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? rating;

  /// Minimum value: 1
  /// Maximum value: 1000
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? size;

  Option<String> state;

  List<String> tagIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? takenAfter;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? takenBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? thumbnailPath;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? trashedAfter;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? trashedBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetTypeEnum? type;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedAfter;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedBefore;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetVisibility? visibility;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? withDeleted;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? withExif;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? withPeople;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? withStacked;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MetadataSearchDto &&
    other.checksum == checksum &&
    other.city == city &&
    other.country == country &&
    other.createdAfter == createdAfter &&
    other.createdBefore == createdBefore &&
    other.description == description &&
    other.deviceAssetId == deviceAssetId &&
    other.deviceId == deviceId &&
    other.encodedVideoPath == encodedVideoPath &&
    other.id == id &&
    other.isEncoded == isEncoded &&
    other.isFavorite == isFavorite &&
    other.isMotion == isMotion &&
    other.isNotInAlbum == isNotInAlbum &&
    other.isOffline == isOffline &&
    other.lensModel == lensModel &&
    other.libraryId == libraryId &&
    other.make == make &&
    other.model == model &&
    other.order == order &&
    other.originalFileName == originalFileName &&
    other.originalPath == originalPath &&
    other.page == page &&
    _deepEquality.equals(other.personIds, personIds) &&
    other.previewPath == previewPath &&
    other.rating == rating &&
    other.size == size &&
    other.state == state &&
    _deepEquality.equals(other.tagIds, tagIds) &&
    other.takenAfter == takenAfter &&
    other.takenBefore == takenBefore &&
    other.thumbnailPath == thumbnailPath &&
    other.trashedAfter == trashedAfter &&
    other.trashedBefore == trashedBefore &&
    other.type == type &&
    other.updatedAfter == updatedAfter &&
    other.updatedBefore == updatedBefore &&
    other.visibility == visibility &&
    other.withDeleted == withDeleted &&
    other.withExif == withExif &&
    other.withPeople == withPeople &&
    other.withStacked == withStacked;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (checksum == null ? 0 : checksum!.hashCode) +
    (city.hashCode) +
    (country.hashCode) +
    (createdAfter == null ? 0 : createdAfter!.hashCode) +
    (createdBefore == null ? 0 : createdBefore!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (deviceAssetId == null ? 0 : deviceAssetId!.hashCode) +
    (deviceId == null ? 0 : deviceId!.hashCode) +
    (encodedVideoPath == null ? 0 : encodedVideoPath!.hashCode) +
    (id == null ? 0 : id!.hashCode) +
    (isEncoded == null ? 0 : isEncoded!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isMotion == null ? 0 : isMotion!.hashCode) +
    (isNotInAlbum == null ? 0 : isNotInAlbum!.hashCode) +
    (isOffline == null ? 0 : isOffline!.hashCode) +
    (lensModel.hashCode) +
    (libraryId.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model.hashCode) +
    (order.hashCode) +
    (originalFileName == null ? 0 : originalFileName!.hashCode) +
    (originalPath == null ? 0 : originalPath!.hashCode) +
    (page == null ? 0 : page!.hashCode) +
    (personIds.hashCode) +
    (previewPath == null ? 0 : previewPath!.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (size == null ? 0 : size!.hashCode) +
    (state.hashCode) +
    (tagIds.hashCode) +
    (takenAfter == null ? 0 : takenAfter!.hashCode) +
    (takenBefore == null ? 0 : takenBefore!.hashCode) +
    (thumbnailPath == null ? 0 : thumbnailPath!.hashCode) +
    (trashedAfter == null ? 0 : trashedAfter!.hashCode) +
    (trashedBefore == null ? 0 : trashedBefore!.hashCode) +
    (type == null ? 0 : type!.hashCode) +
    (updatedAfter == null ? 0 : updatedAfter!.hashCode) +
    (updatedBefore == null ? 0 : updatedBefore!.hashCode) +
    (visibility == null ? 0 : visibility!.hashCode) +
    (withDeleted == null ? 0 : withDeleted!.hashCode) +
    (withExif == null ? 0 : withExif!.hashCode) +
    (withPeople == null ? 0 : withPeople!.hashCode) +
    (withStacked == null ? 0 : withStacked!.hashCode);

  @override
  String toString() => 'MetadataSearchDto[checksum=$checksum, city=$city, country=$country, createdAfter=$createdAfter, createdBefore=$createdBefore, description=$description, deviceAssetId=$deviceAssetId, deviceId=$deviceId, encodedVideoPath=$encodedVideoPath, id=$id, isEncoded=$isEncoded, isFavorite=$isFavorite, isMotion=$isMotion, isNotInAlbum=$isNotInAlbum, isOffline=$isOffline, lensModel=$lensModel, libraryId=$libraryId, make=$make, model=$model, order=$order, originalFileName=$originalFileName, originalPath=$originalPath, page=$page, personIds=$personIds, previewPath=$previewPath, rating=$rating, size=$size, state=$state, tagIds=$tagIds, takenAfter=$takenAfter, takenBefore=$takenBefore, thumbnailPath=$thumbnailPath, trashedAfter=$trashedAfter, trashedBefore=$trashedBefore, type=$type, updatedAfter=$updatedAfter, updatedBefore=$updatedBefore, visibility=$visibility, withDeleted=$withDeleted, withExif=$withExif, withPeople=$withPeople, withStacked=$withStacked]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.checksum != null) {
      json[r'checksum'] = this.checksum;
    } else {
    //  json[r'checksum'] = null;
    }
    if (this.city.unwrapOrNull() != null) {
      json[r'city'] = this.city;
    } else {
      if(this.city.isSome) {
        json[r'city'] = null;
      }
    }
    if (this.country.unwrapOrNull() != null) {
      json[r'country'] = this.country;
    } else {
      if(this.country.isSome) {
        json[r'country'] = null;
      }
    }
    if (this.createdAfter != null) {
      json[r'createdAfter'] = this.createdAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'createdAfter'] = null;
    }
    if (this.createdBefore != null) {
      json[r'createdBefore'] = this.createdBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'createdBefore'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.deviceAssetId != null) {
      json[r'deviceAssetId'] = this.deviceAssetId;
    } else {
    //  json[r'deviceAssetId'] = null;
    }
    if (this.deviceId != null) {
      json[r'deviceId'] = this.deviceId;
    } else {
    //  json[r'deviceId'] = null;
    }
    if (this.encodedVideoPath != null) {
      json[r'encodedVideoPath'] = this.encodedVideoPath;
    } else {
    //  json[r'encodedVideoPath'] = null;
    }
    if (this.id != null) {
      json[r'id'] = this.id;
    } else {
    //  json[r'id'] = null;
    }
    if (this.isEncoded != null) {
      json[r'isEncoded'] = this.isEncoded;
    } else {
    //  json[r'isEncoded'] = null;
    }
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
    if (this.isMotion != null) {
      json[r'isMotion'] = this.isMotion;
    } else {
    //  json[r'isMotion'] = null;
    }
    if (this.isNotInAlbum != null) {
      json[r'isNotInAlbum'] = this.isNotInAlbum;
    } else {
    //  json[r'isNotInAlbum'] = null;
    }
    if (this.isOffline != null) {
      json[r'isOffline'] = this.isOffline;
    } else {
    //  json[r'isOffline'] = null;
    }
    if (this.lensModel.unwrapOrNull() != null) {
      json[r'lensModel'] = this.lensModel;
    } else {
      if(this.lensModel.isSome) {
        json[r'lensModel'] = null;
      }
    }
    if (this.libraryId.unwrapOrNull() != null) {
      json[r'libraryId'] = this.libraryId;
    } else {
      if(this.libraryId.isSome) {
        json[r'libraryId'] = null;
      }
    }
    if (this.make != null) {
      json[r'make'] = this.make;
    } else {
    //  json[r'make'] = null;
    }
    if (this.model.unwrapOrNull() != null) {
      json[r'model'] = this.model;
    } else {
      if(this.model.isSome) {
        json[r'model'] = null;
      }
    }
      json[r'order'] = this.order;
    if (this.originalFileName != null) {
      json[r'originalFileName'] = this.originalFileName;
    } else {
    //  json[r'originalFileName'] = null;
    }
    if (this.originalPath != null) {
      json[r'originalPath'] = this.originalPath;
    } else {
    //  json[r'originalPath'] = null;
    }
    if (this.page != null) {
      json[r'page'] = this.page;
    } else {
    //  json[r'page'] = null;
    }
      json[r'personIds'] = this.personIds;
    if (this.previewPath != null) {
      json[r'previewPath'] = this.previewPath;
    } else {
    //  json[r'previewPath'] = null;
    }
    if (this.rating != null) {
      json[r'rating'] = this.rating;
    } else {
    //  json[r'rating'] = null;
    }
    if (this.size != null) {
      json[r'size'] = this.size;
    } else {
    //  json[r'size'] = null;
    }
    if (this.state.unwrapOrNull() != null) {
      json[r'state'] = this.state;
    } else {
      if(this.state.isSome) {
        json[r'state'] = null;
      }
    }
      json[r'tagIds'] = this.tagIds;
    if (this.takenAfter != null) {
      json[r'takenAfter'] = this.takenAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'takenAfter'] = null;
    }
    if (this.takenBefore != null) {
      json[r'takenBefore'] = this.takenBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'takenBefore'] = null;
    }
    if (this.thumbnailPath != null) {
      json[r'thumbnailPath'] = this.thumbnailPath;
    } else {
    //  json[r'thumbnailPath'] = null;
    }
    if (this.trashedAfter != null) {
      json[r'trashedAfter'] = this.trashedAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'trashedAfter'] = null;
    }
    if (this.trashedBefore != null) {
      json[r'trashedBefore'] = this.trashedBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'trashedBefore'] = null;
    }
    if (this.type != null) {
      json[r'type'] = this.type;
    } else {
    //  json[r'type'] = null;
    }
    if (this.updatedAfter != null) {
      json[r'updatedAfter'] = this.updatedAfter!.toUtc().toIso8601String();
    } else {
    //  json[r'updatedAfter'] = null;
    }
    if (this.updatedBefore != null) {
      json[r'updatedBefore'] = this.updatedBefore!.toUtc().toIso8601String();
    } else {
    //  json[r'updatedBefore'] = null;
    }
    if (this.visibility != null) {
      json[r'visibility'] = this.visibility;
    } else {
    //  json[r'visibility'] = null;
    }
    if (this.withDeleted != null) {
      json[r'withDeleted'] = this.withDeleted;
    } else {
    //  json[r'withDeleted'] = null;
    }
    if (this.withExif != null) {
      json[r'withExif'] = this.withExif;
    } else {
    //  json[r'withExif'] = null;
    }
    if (this.withPeople != null) {
      json[r'withPeople'] = this.withPeople;
    } else {
    //  json[r'withPeople'] = null;
    }
    if (this.withStacked != null) {
      json[r'withStacked'] = this.withStacked;
    } else {
    //  json[r'withStacked'] = null;
    }
    return json;
  }

  /// Returns a new [MetadataSearchDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MetadataSearchDto? fromJson(dynamic value) {
    upgradeDto(value, "MetadataSearchDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MetadataSearchDto(
        checksum: mapValueOfType<String>(json, r'checksum'),
        city: Option.from(mapValueOfType<String>(json, r'city')),
        country: Option.from(mapValueOfType<String>(json, r'country')),
        createdAfter:  mapDateTime(json, r'createdAfter', r''),
        createdBefore:  mapDateTime(json, r'createdBefore', r''),
        description: mapValueOfType<String>(json, r'description'),
        deviceAssetId: mapValueOfType<String>(json, r'deviceAssetId'),
        deviceId: mapValueOfType<String>(json, r'deviceId'),
        encodedVideoPath: mapValueOfType<String>(json, r'encodedVideoPath'),
        id: mapValueOfType<String>(json, r'id'),
        isEncoded: mapValueOfType<bool>(json, r'isEncoded'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isMotion: mapValueOfType<bool>(json, r'isMotion'),
        isNotInAlbum: mapValueOfType<bool>(json, r'isNotInAlbum'),
        isOffline: mapValueOfType<bool>(json, r'isOffline'),
        lensModel: Option.from(mapValueOfType<String>(json, r'lensModel')),
        libraryId: Option.from(mapValueOfType<String>(json, r'libraryId')),
        make: mapValueOfType<String>(json, r'make'),
        model: Option.from(mapValueOfType<String>(json, r'model')),
        order: AssetOrder.fromJson(json[r'order']) ?? AssetOrder.desc,
        originalFileName: mapValueOfType<String>(json, r'originalFileName'),
        originalPath: mapValueOfType<String>(json, r'originalPath'),
        page: num.parse('${json[r'page']}'),
        personIds: json[r'personIds'] is Iterable
            ? (json[r'personIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        previewPath: mapValueOfType<String>(json, r'previewPath'),
        rating: num.parse('${json[r'rating']}'),
        size: num.parse('${json[r'size']}'),
        state: Option.from(mapValueOfType<String>(json, r'state')),
        tagIds: json[r'tagIds'] is Iterable
            ? (json[r'tagIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        takenAfter:  mapDateTime(json, r'takenAfter', r''),
        takenBefore:  mapDateTime(json, r'takenBefore', r''),
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath'),
        trashedAfter:  mapDateTime(json, r'trashedAfter', r''),
        trashedBefore:  mapDateTime(json, r'trashedBefore', r''),
        type: AssetTypeEnum.fromJson(json[r'type']),
        updatedAfter:  mapDateTime(json, r'updatedAfter', r''),
        updatedBefore:  mapDateTime(json, r'updatedBefore', r''),
        visibility: AssetVisibility.fromJson(json[r'visibility']),
        withDeleted: mapValueOfType<bool>(json, r'withDeleted'),
        withExif: mapValueOfType<bool>(json, r'withExif'),
        withPeople: mapValueOfType<bool>(json, r'withPeople'),
        withStacked: mapValueOfType<bool>(json, r'withStacked'),
      );
    }
    return null;
  }

  static List<MetadataSearchDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MetadataSearchDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MetadataSearchDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MetadataSearchDto> mapFromJson(dynamic json) {
    final map = <String, MetadataSearchDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MetadataSearchDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MetadataSearchDto-objects as value to a dart map
  static Map<String, List<MetadataSearchDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MetadataSearchDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MetadataSearchDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}

