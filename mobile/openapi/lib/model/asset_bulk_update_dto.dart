//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetBulkUpdateDto {
  /// Returns a new [AssetBulkUpdateDto] instance.
  AssetBulkUpdateDto({
    this.dateTimeOriginal,
    this.duplicateId,
    this.ids = const [],
    this.isArchived,
    this.isFavorite,
    this.latitude,
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

  String? duplicateId;

  List<String> ids;

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

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? longitude;

  AssetBulkUpdateDtoOrientationEnum? orientation;

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
  bool operator ==(Object other) => identical(this, other) || other is AssetBulkUpdateDto &&
    other.dateTimeOriginal == dateTimeOriginal &&
    other.duplicateId == duplicateId &&
    _deepEquality.equals(other.ids, ids) &&
    other.isArchived == isArchived &&
    other.isFavorite == isFavorite &&
    other.latitude == latitude &&
    other.longitude == longitude &&
    other.orientation == orientation &&
    other.rating == rating;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (ids.hashCode) +
    (isArchived == null ? 0 : isArchived!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (rating == null ? 0 : rating!.hashCode);

  @override
  String toString() => 'AssetBulkUpdateDto[dateTimeOriginal=$dateTimeOriginal, duplicateId=$duplicateId, ids=$ids, isArchived=$isArchived, isFavorite=$isFavorite, latitude=$latitude, longitude=$longitude, orientation=$orientation, rating=$rating]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.dateTimeOriginal != null) {
      json[r'dateTimeOriginal'] = this.dateTimeOriginal;
    } else {
    //  json[r'dateTimeOriginal'] = null;
    }
    if (this.duplicateId != null) {
      json[r'duplicateId'] = this.duplicateId;
    } else {
    //  json[r'duplicateId'] = null;
    }
      json[r'ids'] = this.ids;
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

  /// Returns a new [AssetBulkUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetBulkUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetBulkUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetBulkUpdateDto(
        dateTimeOriginal: mapValueOfType<String>(json, r'dateTimeOriginal'),
        duplicateId: mapValueOfType<String>(json, r'duplicateId'),
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        isArchived: mapValueOfType<bool>(json, r'isArchived'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        latitude: num.parse('${json[r'latitude']}'),
        longitude: num.parse('${json[r'longitude']}'),
        orientation: AssetBulkUpdateDtoOrientationEnum.fromJson(json[r'orientation']),
        rating: num.parse('${json[r'rating']}'),
      );
    }
    return null;
  }

  static List<AssetBulkUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetBulkUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetBulkUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetBulkUpdateDto> mapFromJson(dynamic json) {
    final map = <String, AssetBulkUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetBulkUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetBulkUpdateDto-objects as value to a dart map
  static Map<String, List<AssetBulkUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetBulkUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetBulkUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ids',
  };
}


class AssetBulkUpdateDtoOrientationEnum {
  /// Instantiate a new enum with the provided [value].
  const AssetBulkUpdateDtoOrientationEnum._(this.value);

  /// The underlying value of this enum member.
  final int value;

  @override
  String toString() => value.toString();

  int toJson() => value;

  static const number1 = AssetBulkUpdateDtoOrientationEnum._(1);
  static const number2 = AssetBulkUpdateDtoOrientationEnum._(2);
  static const number3 = AssetBulkUpdateDtoOrientationEnum._(3);
  static const number4 = AssetBulkUpdateDtoOrientationEnum._(4);
  static const number5 = AssetBulkUpdateDtoOrientationEnum._(5);
  static const number6 = AssetBulkUpdateDtoOrientationEnum._(6);
  static const number7 = AssetBulkUpdateDtoOrientationEnum._(7);
  static const number8 = AssetBulkUpdateDtoOrientationEnum._(8);

  /// List of all possible values in this [enum][AssetBulkUpdateDtoOrientationEnum].
  static const values = <AssetBulkUpdateDtoOrientationEnum>[
    number1,
    number2,
    number3,
    number4,
    number5,
    number6,
    number7,
    number8,
  ];

  static AssetBulkUpdateDtoOrientationEnum? fromJson(dynamic value) => AssetBulkUpdateDtoOrientationEnumTypeTransformer().decode(value);

  static List<AssetBulkUpdateDtoOrientationEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetBulkUpdateDtoOrientationEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetBulkUpdateDtoOrientationEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AssetBulkUpdateDtoOrientationEnum] to int,
/// and [decode] dynamic data back to [AssetBulkUpdateDtoOrientationEnum].
class AssetBulkUpdateDtoOrientationEnumTypeTransformer {
  factory AssetBulkUpdateDtoOrientationEnumTypeTransformer() => _instance ??= const AssetBulkUpdateDtoOrientationEnumTypeTransformer._();

  const AssetBulkUpdateDtoOrientationEnumTypeTransformer._();

  int encode(AssetBulkUpdateDtoOrientationEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AssetBulkUpdateDtoOrientationEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AssetBulkUpdateDtoOrientationEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case 1: return AssetBulkUpdateDtoOrientationEnum.number1;
        case 2: return AssetBulkUpdateDtoOrientationEnum.number2;
        case 3: return AssetBulkUpdateDtoOrientationEnum.number3;
        case 4: return AssetBulkUpdateDtoOrientationEnum.number4;
        case 5: return AssetBulkUpdateDtoOrientationEnum.number5;
        case 6: return AssetBulkUpdateDtoOrientationEnum.number6;
        case 7: return AssetBulkUpdateDtoOrientationEnum.number7;
        case 8: return AssetBulkUpdateDtoOrientationEnum.number8;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AssetBulkUpdateDtoOrientationEnumTypeTransformer] instance.
  static AssetBulkUpdateDtoOrientationEnumTypeTransformer? _instance;
}


