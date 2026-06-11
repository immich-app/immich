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
    this.city = const Optional.absent(),
    this.country = const Optional.absent(),
    this.dateTimeOriginal = const Optional.absent(),
    this.description = const Optional.absent(),
    this.exifImageHeight = const Optional.absent(),
    this.exifImageWidth = const Optional.absent(),
    this.exposureTime = const Optional.absent(),
    this.fNumber = const Optional.absent(),
    this.fileSizeInByte = const Optional.absent(),
    this.focalLength = const Optional.absent(),
    this.iso = const Optional.absent(),
    this.latitude = const Optional.absent(),
    this.lensModel = const Optional.absent(),
    this.longitude = const Optional.absent(),
    this.make = const Optional.absent(),
    this.model = const Optional.absent(),
    this.modifyDate = const Optional.absent(),
    this.orientation = const Optional.absent(),
    this.projectionType = const Optional.absent(),
    this.rating = const Optional.absent(),
    this.state = const Optional.absent(),
    this.timeZone = const Optional.absent(),
  });

  /// City name
  Optional<String?> city;

  /// Country name
  Optional<String?> country;

  /// Original date/time
  Optional<DateTime?> dateTimeOriginal;

  /// Image description
  Optional<String?> description;

  /// Image height in pixels
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  Optional<int?> exifImageHeight;

  /// Image width in pixels
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  Optional<int?> exifImageWidth;

  /// Exposure time
  Optional<String?> exposureTime;

  /// F-number (aperture)
  Optional<num?> fNumber;

  /// File size in bytes
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  Optional<int?> fileSizeInByte;

  /// Focal length in mm
  Optional<num?> focalLength;

  /// ISO sensitivity
  ///
  /// Minimum value: -9007199254740991
  /// Maximum value: 9007199254740991
  Optional<int?> iso;

  /// GPS latitude
  Optional<num?> latitude;

  /// Lens model
  Optional<String?> lensModel;

  /// GPS longitude
  Optional<num?> longitude;

  /// Camera make
  Optional<String?> make;

  /// Camera model
  Optional<String?> model;

  /// Modification date/time
  Optional<DateTime?> modifyDate;

  /// Image orientation
  Optional<String?> orientation;

  /// Projection type
  Optional<String?> projectionType;

  /// Rating
  ///
  /// Minimum value: 1
  /// Maximum value: 5
  Optional<int?> rating;

  /// State/province name
  Optional<String?> state;

  /// Time zone
  Optional<String?> timeZone;

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
    if (this.city.isPresent) {
      final value = this.city.value;
      json[r'city'] = value;
    }
    if (this.country.isPresent) {
      final value = this.country.value;
      json[r'country'] = value;
    }
    if (this.dateTimeOriginal.isPresent) {
      final value = this.dateTimeOriginal.value;
      json[r'dateTimeOriginal'] = value == null ? null : value.toUtc().toIso8601String();
    }
    if (this.description.isPresent) {
      final value = this.description.value;
      json[r'description'] = value;
    }
    if (this.exifImageHeight.isPresent) {
      final value = this.exifImageHeight.value;
      json[r'exifImageHeight'] = value;
    }
    if (this.exifImageWidth.isPresent) {
      final value = this.exifImageWidth.value;
      json[r'exifImageWidth'] = value;
    }
    if (this.exposureTime.isPresent) {
      final value = this.exposureTime.value;
      json[r'exposureTime'] = value;
    }
    if (this.fNumber.isPresent) {
      final value = this.fNumber.value;
      json[r'fNumber'] = value;
    }
    if (this.fileSizeInByte.isPresent) {
      final value = this.fileSizeInByte.value;
      json[r'fileSizeInByte'] = value;
    }
    if (this.focalLength.isPresent) {
      final value = this.focalLength.value;
      json[r'focalLength'] = value;
    }
    if (this.iso.isPresent) {
      final value = this.iso.value;
      json[r'iso'] = value;
    }
    if (this.latitude.isPresent) {
      final value = this.latitude.value;
      json[r'latitude'] = value;
    }
    if (this.lensModel.isPresent) {
      final value = this.lensModel.value;
      json[r'lensModel'] = value;
    }
    if (this.longitude.isPresent) {
      final value = this.longitude.value;
      json[r'longitude'] = value;
    }
    if (this.make.isPresent) {
      final value = this.make.value;
      json[r'make'] = value;
    }
    if (this.model.isPresent) {
      final value = this.model.value;
      json[r'model'] = value;
    }
    if (this.modifyDate.isPresent) {
      final value = this.modifyDate.value;
      json[r'modifyDate'] = value == null ? null : value.toUtc().toIso8601String();
    }
    if (this.orientation.isPresent) {
      final value = this.orientation.value;
      json[r'orientation'] = value;
    }
    if (this.projectionType.isPresent) {
      final value = this.projectionType.value;
      json[r'projectionType'] = value;
    }
    if (this.rating.isPresent) {
      final value = this.rating.value;
      json[r'rating'] = value;
    }
    if (this.state.isPresent) {
      final value = this.state.value;
      json[r'state'] = value;
    }
    if (this.timeZone.isPresent) {
      final value = this.timeZone.value;
      json[r'timeZone'] = value;
    }
    return json;
  }

  /// Returns a new [ExifResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ExifResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "ExifResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ExifResponseDto(
        city: json.containsKey(r'city') ? Optional.present(mapValueOfType<String>(json, r'city')) : const Optional.absent(),
        country: json.containsKey(r'country') ? Optional.present(mapValueOfType<String>(json, r'country')) : const Optional.absent(),
        dateTimeOriginal: json.containsKey(r'dateTimeOriginal') ? Optional.present(mapDateTime(json, r'dateTimeOriginal', r'')) : const Optional.absent(),
        description: json.containsKey(r'description') ? Optional.present(mapValueOfType<String>(json, r'description')) : const Optional.absent(),
        exifImageHeight: json.containsKey(r'exifImageHeight') ? Optional.present(json[r'exifImageHeight'] == null ? null : int.parse('${json[r'exifImageHeight']}')) : const Optional.absent(),
        exifImageWidth: json.containsKey(r'exifImageWidth') ? Optional.present(json[r'exifImageWidth'] == null ? null : int.parse('${json[r'exifImageWidth']}')) : const Optional.absent(),
        exposureTime: json.containsKey(r'exposureTime') ? Optional.present(mapValueOfType<String>(json, r'exposureTime')) : const Optional.absent(),
        fNumber: json.containsKey(r'fNumber') ? Optional.present(json[r'fNumber'] == null ? null : num.parse('${json[r'fNumber']}')) : const Optional.absent(),
        fileSizeInByte: json.containsKey(r'fileSizeInByte') ? Optional.present(json[r'fileSizeInByte'] == null ? null : int.parse('${json[r'fileSizeInByte']}')) : const Optional.absent(),
        focalLength: json.containsKey(r'focalLength') ? Optional.present(json[r'focalLength'] == null ? null : num.parse('${json[r'focalLength']}')) : const Optional.absent(),
        iso: json.containsKey(r'iso') ? Optional.present(json[r'iso'] == null ? null : int.parse('${json[r'iso']}')) : const Optional.absent(),
        latitude: json.containsKey(r'latitude') ? Optional.present(json[r'latitude'] == null ? null : num.parse('${json[r'latitude']}')) : const Optional.absent(),
        lensModel: json.containsKey(r'lensModel') ? Optional.present(mapValueOfType<String>(json, r'lensModel')) : const Optional.absent(),
        longitude: json.containsKey(r'longitude') ? Optional.present(json[r'longitude'] == null ? null : num.parse('${json[r'longitude']}')) : const Optional.absent(),
        make: json.containsKey(r'make') ? Optional.present(mapValueOfType<String>(json, r'make')) : const Optional.absent(),
        model: json.containsKey(r'model') ? Optional.present(mapValueOfType<String>(json, r'model')) : const Optional.absent(),
        modifyDate: json.containsKey(r'modifyDate') ? Optional.present(mapDateTime(json, r'modifyDate', r'')) : const Optional.absent(),
        orientation: json.containsKey(r'orientation') ? Optional.present(mapValueOfType<String>(json, r'orientation')) : const Optional.absent(),
        projectionType: json.containsKey(r'projectionType') ? Optional.present(mapValueOfType<String>(json, r'projectionType')) : const Optional.absent(),
        rating: json.containsKey(r'rating') ? Optional.present(json[r'rating'] == null ? null : int.parse('${json[r'rating']}')) : const Optional.absent(),
        state: json.containsKey(r'state') ? Optional.present(mapValueOfType<String>(json, r'state')) : const Optional.absent(),
        timeZone: json.containsKey(r'timeZone') ? Optional.present(mapValueOfType<String>(json, r'timeZone')) : const Optional.absent(),
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

