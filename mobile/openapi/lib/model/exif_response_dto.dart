//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ExifResponseDto {
  /// Returns a new [ExifResponseDto] instance.
  ExifResponseDto({
    this.city,
    this.country,
    this.dateTimeOriginal,
    this.description,
    this.exifImageHeight,
    this.exifImageWidth,
    this.exposureTime,
    this.fNumber,
    this.fileSizeInByte,
    this.focalLength,
    this.iso,
    this.latitude,
    this.lensModel,
    this.longitude,
    this.make,
    this.model,
    this.modifyDate,
    this.orientation,
    this.projectionType,
    this.rating,
    this.state,
    this.timeZone,
  });

  String? city;

  String? country;

  DateTime? dateTimeOriginal;

  String? description;

  num? exifImageHeight;

  num? exifImageWidth;

  String? exposureTime;

  num? fNumber;

  int? fileSizeInByte;

  num? focalLength;

  num? iso;

  num? latitude;

  String? lensModel;

  num? longitude;

  String? make;

  String? model;

  DateTime? modifyDate;

  ExifResponseDtoOrientationEnum? orientation;

  String? projectionType;

  num? rating;

  String? state;

  String? timeZone;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ExifResponseDto &&
    other.city == city &&
    other.country == country &&
    other.dateTimeOriginal == dateTimeOriginal &&
    other.description == description &&
    other.exifImageHeight == exifImageHeight &&
    other.exifImageWidth == exifImageWidth &&
    other.exposureTime == exposureTime &&
    other.fNumber == fNumber &&
    other.fileSizeInByte == fileSizeInByte &&
    other.focalLength == focalLength &&
    other.iso == iso &&
    other.latitude == latitude &&
    other.lensModel == lensModel &&
    other.longitude == longitude &&
    other.make == make &&
    other.model == model &&
    other.modifyDate == modifyDate &&
    other.orientation == orientation &&
    other.projectionType == projectionType &&
    other.rating == rating &&
    other.state == state &&
    other.timeZone == timeZone;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (city == null ? 0 : city!.hashCode) +
    (country == null ? 0 : country!.hashCode) +
    (dateTimeOriginal == null ? 0 : dateTimeOriginal!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (exifImageHeight == null ? 0 : exifImageHeight!.hashCode) +
    (exifImageWidth == null ? 0 : exifImageWidth!.hashCode) +
    (exposureTime == null ? 0 : exposureTime!.hashCode) +
    (fNumber == null ? 0 : fNumber!.hashCode) +
    (fileSizeInByte == null ? 0 : fileSizeInByte!.hashCode) +
    (focalLength == null ? 0 : focalLength!.hashCode) +
    (iso == null ? 0 : iso!.hashCode) +
    (latitude == null ? 0 : latitude!.hashCode) +
    (lensModel == null ? 0 : lensModel!.hashCode) +
    (longitude == null ? 0 : longitude!.hashCode) +
    (make == null ? 0 : make!.hashCode) +
    (model == null ? 0 : model!.hashCode) +
    (modifyDate == null ? 0 : modifyDate!.hashCode) +
    (orientation == null ? 0 : orientation!.hashCode) +
    (projectionType == null ? 0 : projectionType!.hashCode) +
    (rating == null ? 0 : rating!.hashCode) +
    (state == null ? 0 : state!.hashCode) +
    (timeZone == null ? 0 : timeZone!.hashCode);

  @override
  String toString() => 'ExifResponseDto[city=$city, country=$country, dateTimeOriginal=$dateTimeOriginal, description=$description, exifImageHeight=$exifImageHeight, exifImageWidth=$exifImageWidth, exposureTime=$exposureTime, fNumber=$fNumber, fileSizeInByte=$fileSizeInByte, focalLength=$focalLength, iso=$iso, latitude=$latitude, lensModel=$lensModel, longitude=$longitude, make=$make, model=$model, modifyDate=$modifyDate, orientation=$orientation, projectionType=$projectionType, rating=$rating, state=$state, timeZone=$timeZone]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.city != null) {
      json[r'city'] = this.city;
    } else {
    //  json[r'city'] = null;
    }
    if (this.country != null) {
      json[r'country'] = this.country;
    } else {
    //  json[r'country'] = null;
    }
    if (this.dateTimeOriginal != null) {
      json[r'dateTimeOriginal'] = this.dateTimeOriginal!.toUtc().toIso8601String();
    } else {
    //  json[r'dateTimeOriginal'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.exifImageHeight != null) {
      json[r'exifImageHeight'] = this.exifImageHeight;
    } else {
    //  json[r'exifImageHeight'] = null;
    }
    if (this.exifImageWidth != null) {
      json[r'exifImageWidth'] = this.exifImageWidth;
    } else {
    //  json[r'exifImageWidth'] = null;
    }
    if (this.exposureTime != null) {
      json[r'exposureTime'] = this.exposureTime;
    } else {
    //  json[r'exposureTime'] = null;
    }
    if (this.fNumber != null) {
      json[r'fNumber'] = this.fNumber;
    } else {
    //  json[r'fNumber'] = null;
    }
    if (this.fileSizeInByte != null) {
      json[r'fileSizeInByte'] = this.fileSizeInByte;
    } else {
    //  json[r'fileSizeInByte'] = null;
    }
    if (this.focalLength != null) {
      json[r'focalLength'] = this.focalLength;
    } else {
    //  json[r'focalLength'] = null;
    }
    if (this.iso != null) {
      json[r'iso'] = this.iso;
    } else {
    //  json[r'iso'] = null;
    }
    if (this.latitude != null) {
      json[r'latitude'] = this.latitude;
    } else {
    //  json[r'latitude'] = null;
    }
    if (this.lensModel != null) {
      json[r'lensModel'] = this.lensModel;
    } else {
    //  json[r'lensModel'] = null;
    }
    if (this.longitude != null) {
      json[r'longitude'] = this.longitude;
    } else {
    //  json[r'longitude'] = null;
    }
    if (this.make != null) {
      json[r'make'] = this.make;
    } else {
    //  json[r'make'] = null;
    }
    if (this.model != null) {
      json[r'model'] = this.model;
    } else {
    //  json[r'model'] = null;
    }
    if (this.modifyDate != null) {
      json[r'modifyDate'] = this.modifyDate!.toUtc().toIso8601String();
    } else {
    //  json[r'modifyDate'] = null;
    }
    if (this.orientation != null) {
      json[r'orientation'] = this.orientation;
    } else {
    //  json[r'orientation'] = null;
    }
    if (this.projectionType != null) {
      json[r'projectionType'] = this.projectionType;
    } else {
    //  json[r'projectionType'] = null;
    }
    if (this.rating != null) {
      json[r'rating'] = this.rating;
    } else {
    //  json[r'rating'] = null;
    }
    if (this.state != null) {
      json[r'state'] = this.state;
    } else {
    //  json[r'state'] = null;
    }
    if (this.timeZone != null) {
      json[r'timeZone'] = this.timeZone;
    } else {
    //  json[r'timeZone'] = null;
    }
    return json;
  }

  /// Returns a new [ExifResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ExifResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ExifResponseDto(
        city: mapValueOfType<String>(json, r'city'),
        country: mapValueOfType<String>(json, r'country'),
        dateTimeOriginal: mapDateTime(json, r'dateTimeOriginal', r''),
        description: mapValueOfType<String>(json, r'description'),
        exifImageHeight: json[r'exifImageHeight'] == null
            ? null
            : num.parse('${json[r'exifImageHeight']}'),
        exifImageWidth: json[r'exifImageWidth'] == null
            ? null
            : num.parse('${json[r'exifImageWidth']}'),
        exposureTime: mapValueOfType<String>(json, r'exposureTime'),
        fNumber: json[r'fNumber'] == null
            ? null
            : num.parse('${json[r'fNumber']}'),
        fileSizeInByte: mapValueOfType<int>(json, r'fileSizeInByte'),
        focalLength: json[r'focalLength'] == null
            ? null
            : num.parse('${json[r'focalLength']}'),
        iso: json[r'iso'] == null
            ? null
            : num.parse('${json[r'iso']}'),
        latitude: json[r'latitude'] == null
            ? null
            : num.parse('${json[r'latitude']}'),
        lensModel: mapValueOfType<String>(json, r'lensModel'),
        longitude: json[r'longitude'] == null
            ? null
            : num.parse('${json[r'longitude']}'),
        make: mapValueOfType<String>(json, r'make'),
        model: mapValueOfType<String>(json, r'model'),
        modifyDate: mapDateTime(json, r'modifyDate', r''),
        orientation: json[r'orientation'] == null
            ? null
            : ExifResponseDtoOrientationEnum.parse('${json[r'orientation']}'),
        projectionType: mapValueOfType<String>(json, r'projectionType'),
        rating: json[r'rating'] == null
            ? null
            : num.parse('${json[r'rating']}'),
        state: mapValueOfType<String>(json, r'state'),
        timeZone: mapValueOfType<String>(json, r'timeZone'),
      );
    }
    return null;
  }

  static List<ExifResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ExifResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ExifResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ExifResponseDto> mapFromJson(dynamic json) {
    final map = <String, ExifResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ExifResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ExifResponseDto-objects as value to a dart map
  static Map<String, List<ExifResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ExifResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ExifResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


class ExifResponseDtoOrientationEnum {
  /// Instantiate a new enum with the provided [value].
  const ExifResponseDtoOrientationEnum._(this.value);

  /// The underlying value of this enum member.
  final num value;

  @override
  String toString() => value.toString();

  num toJson() => value;

  static const n1 = ExifResponseDtoOrientationEnum._('1');
  static const n2 = ExifResponseDtoOrientationEnum._('2');
  static const n8 = ExifResponseDtoOrientationEnum._('8');
  static const n7 = ExifResponseDtoOrientationEnum._('7');
  static const n3 = ExifResponseDtoOrientationEnum._('3');
  static const n4 = ExifResponseDtoOrientationEnum._('4');
  static const n6 = ExifResponseDtoOrientationEnum._('6');
  static const n5 = ExifResponseDtoOrientationEnum._('5');

  /// List of all possible values in this [enum][ExifResponseDtoOrientationEnum].
  static const values = <ExifResponseDtoOrientationEnum>[
    n1,
    n2,
    n8,
    n7,
    n3,
    n4,
    n6,
    n5,
  ];

  static ExifResponseDtoOrientationEnum? fromJson(dynamic value) => ExifResponseDtoOrientationEnumTypeTransformer().decode(value);

  static List<ExifResponseDtoOrientationEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ExifResponseDtoOrientationEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ExifResponseDtoOrientationEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [ExifResponseDtoOrientationEnum] to num,
/// and [decode] dynamic data back to [ExifResponseDtoOrientationEnum].
class ExifResponseDtoOrientationEnumTypeTransformer {
  factory ExifResponseDtoOrientationEnumTypeTransformer() => _instance ??= const ExifResponseDtoOrientationEnumTypeTransformer._();

  const ExifResponseDtoOrientationEnumTypeTransformer._();

  num encode(ExifResponseDtoOrientationEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a ExifResponseDtoOrientationEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  ExifResponseDtoOrientationEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case '1': return ExifResponseDtoOrientationEnum.n1;
        case '2': return ExifResponseDtoOrientationEnum.n2;
        case '8': return ExifResponseDtoOrientationEnum.n8;
        case '7': return ExifResponseDtoOrientationEnum.n7;
        case '3': return ExifResponseDtoOrientationEnum.n3;
        case '4': return ExifResponseDtoOrientationEnum.n4;
        case '6': return ExifResponseDtoOrientationEnum.n6;
        case '5': return ExifResponseDtoOrientationEnum.n5;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [ExifResponseDtoOrientationEnumTypeTransformer] instance.
  static ExifResponseDtoOrientationEnumTypeTransformer? _instance;
}


