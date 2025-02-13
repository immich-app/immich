//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateAssetDto {
  /// Returns a new [UpdateAssetDto] instance.
  UpdateAssetDto({
    this.dateTimeOriginal,
    this.description,
    this.isArchived,
    this.isFavorite,
    this.latitude,
    this.livePhotoVideoId,
    this.longitude,
    this.orientation,
    this.rating,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? dateTimeOriginal;

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
  bool? isArchived;

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
  num? latitude;

  String? livePhotoVideoId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? longitude;

  UpdateAssetDtoOrientationEnum? orientation;

  /// Minimum value: -1
  /// Maximum value: 5
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? rating;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateAssetDto &&
    other.dateTimeOriginal == dateTimeOriginal &&
    other.description == description &&
    other.isArchived == isArchived &&
    other.isFavorite == isFavorite &&
    other.latitude == latitude &&
    other.livePhotoVideoId == livePhotoVideoId &&
    other.longitude == longitude &&
    other.orientation == orientation &&
    other.rating == rating;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (isArchived == null ? 0 : isArchived!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (livePhotoVideoId == null ? 0 : livePhotoVideoId!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (rating == null ? 0 : rating!.hashCode);

  @override
  String toString() => 'UpdateAssetDto[dateTimeOriginal=$dateTimeOriginal, description=$description, isArchived=$isArchived, isFavorite=$isFavorite, latitude=$latitude, livePhotoVideoId=$livePhotoVideoId, longitude=$longitude, orientation=$orientation, rating=$rating]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.dateTimeOriginal != null) {
      json[r'dateTimeOriginal'] = this.dateTimeOriginal;
    } else {
    //  json[r'dateTimeOriginal'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.isArchived != null) {
      json[r'isArchived'] = this.isArchived;
    } else {
    //  json[r'isArchived'] = null;
    }
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
    if (this.latitude != null) {
      json[r'latitude'] = this.latitude;
    } else {
    //  json[r'latitude'] = null;
    }
    if (this.livePhotoVideoId != null) {
      json[r'livePhotoVideoId'] = this.livePhotoVideoId;
    } else {
    //  json[r'livePhotoVideoId'] = null;
    }
    if (this.longitude != null) {
      json[r'longitude'] = this.longitude;
    } else {
    //  json[r'longitude'] = null;
    }
    if (this.orientation != null) {
      json[r'orientation'] = this.orientation;
    } else {
    //  json[r'orientation'] = null;
    }
    if (this.rating != null) {
      json[r'rating'] = this.rating;
    } else {
    //  json[r'rating'] = null;
    }
    return json;
  }

  /// Returns a new [UpdateAssetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateAssetDto? fromJson(dynamic value) {
    upgradeDto(value, "UpdateAssetDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateAssetDto(
        dateTimeOriginal: mapValueOfType<String>(json, r'dateTimeOriginal'),
        description: mapValueOfType<String>(json, r'description'),
        isArchived: mapValueOfType<bool>(json, r'isArchived'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        latitude: num.parse('${json[r'latitude']}'),
        livePhotoVideoId: mapValueOfType<String>(json, r'livePhotoVideoId'),
        longitude: num.parse('${json[r'longitude']}'),
        orientation: UpdateAssetDtoOrientationEnum.fromJson(json[r'orientation']),
        rating: num.parse('${json[r'rating']}'),
      );
    }
    return null;
  }

  static List<UpdateAssetDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateAssetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateAssetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateAssetDto> mapFromJson(dynamic json) {
    final map = <String, UpdateAssetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAssetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateAssetDto-objects as value to a dart map
  static Map<String, List<UpdateAssetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateAssetDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateAssetDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


class UpdateAssetDtoOrientationEnum {
  /// Instantiate a new enum with the provided [value].
  const UpdateAssetDtoOrientationEnum._(this.value);

  /// The underlying value of this enum member.
  final int value;

  @override
  String toString() => value.toString();

  int toJson() => value;

  static const number1 = UpdateAssetDtoOrientationEnum._(1);
  static const number2 = UpdateAssetDtoOrientationEnum._(2);
  static const number3 = UpdateAssetDtoOrientationEnum._(3);
  static const number4 = UpdateAssetDtoOrientationEnum._(4);
  static const number5 = UpdateAssetDtoOrientationEnum._(5);
  static const number6 = UpdateAssetDtoOrientationEnum._(6);
  static const number7 = UpdateAssetDtoOrientationEnum._(7);
  static const number8 = UpdateAssetDtoOrientationEnum._(8);

  /// List of all possible values in this [enum][UpdateAssetDtoOrientationEnum].
  static const values = <UpdateAssetDtoOrientationEnum>[
    number1,
    number2,
    number3,
    number4,
    number5,
    number6,
    number7,
    number8,
  ];

  static UpdateAssetDtoOrientationEnum? fromJson(dynamic value) => UpdateAssetDtoOrientationEnumTypeTransformer().decode(value);

  static List<UpdateAssetDtoOrientationEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateAssetDtoOrientationEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateAssetDtoOrientationEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [UpdateAssetDtoOrientationEnum] to int,
/// and [decode] dynamic data back to [UpdateAssetDtoOrientationEnum].
class UpdateAssetDtoOrientationEnumTypeTransformer {
  factory UpdateAssetDtoOrientationEnumTypeTransformer() => _instance ??= const UpdateAssetDtoOrientationEnumTypeTransformer._();

  const UpdateAssetDtoOrientationEnumTypeTransformer._();

  int encode(UpdateAssetDtoOrientationEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a UpdateAssetDtoOrientationEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  UpdateAssetDtoOrientationEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case 1: return UpdateAssetDtoOrientationEnum.number1;
        case 2: return UpdateAssetDtoOrientationEnum.number2;
        case 3: return UpdateAssetDtoOrientationEnum.number3;
        case 4: return UpdateAssetDtoOrientationEnum.number4;
        case 5: return UpdateAssetDtoOrientationEnum.number5;
        case 6: return UpdateAssetDtoOrientationEnum.number6;
        case 7: return UpdateAssetDtoOrientationEnum.number7;
        case 8: return UpdateAssetDtoOrientationEnum.number8;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [UpdateAssetDtoOrientationEnumTypeTransformer] instance.
  static UpdateAssetDtoOrientationEnumTypeTransformer? _instance;
}


