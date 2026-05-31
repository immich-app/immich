// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// EXIF response
final class ExifResponseDto {
  const ExifResponseDto({
    this.city = null,
    this.country = null,
    this.dateTimeOriginal = null,
    this.description = null,
    this.exifImageHeight = null,
    this.exifImageWidth = null,
    this.exposureTime = null,
    this.fNumber = null,
    this.fileSizeInByte = null,
    this.focalLength = null,
    this.iso = null,
    this.latitude = null,
    this.lensModel = null,
    this.longitude = null,
    this.make = null,
    this.model = null,
    this.modifyDate = null,
    this.orientation = null,
    this.projectionType = null,
    this.rating = null,
    this.state = null,
    this.timeZone = null,
  });

  /// City name
  final String? city;

  /// Country name
  final String? country;

  /// Original date/time
  final DateTime? dateTimeOriginal;

  /// Image description
  final String? description;

  /// Image height in pixels
  final int? exifImageHeight;

  /// Image width in pixels
  final int? exifImageWidth;

  /// Exposure time
  final String? exposureTime;

  /// F-number (aperture)
  final double? fNumber;

  /// File size in bytes
  final int? fileSizeInByte;

  /// Focal length in mm
  final double? focalLength;

  /// ISO sensitivity
  final int? iso;

  /// GPS latitude
  final double? latitude;

  /// Lens model
  final String? lensModel;

  /// GPS longitude
  final double? longitude;

  /// Camera make
  final String? make;

  /// Camera model
  final String? model;

  /// Modification date/time
  final DateTime? modifyDate;

  /// Image orientation
  final String? orientation;

  /// Projection type
  final String? projectionType;

  /// Rating
  final int? rating;

  /// State/province name
  final String? state;

  /// Time zone
  final String? timeZone;

  static const _undefined = Object();

  static ExifResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<ExifResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      city: (json[r'city'] as String?),
      country: (json[r'country'] as String?),
      dateTimeOriginal: (json[r'dateTimeOriginal'] == null
          ? null
          : DateTime.parse(json[r'dateTimeOriginal'] as String)),
      description: (json[r'description'] as String?),
      exifImageHeight: (json[r'exifImageHeight'] as int?),
      exifImageWidth: (json[r'exifImageWidth'] as int?),
      exposureTime: (json[r'exposureTime'] as String?),
      fNumber: (json[r'fNumber'] as num?)?.toDouble(),
      fileSizeInByte: (json[r'fileSizeInByte'] as int?),
      focalLength: (json[r'focalLength'] as num?)?.toDouble(),
      iso: (json[r'iso'] as int?),
      latitude: (json[r'latitude'] as num?)?.toDouble(),
      lensModel: (json[r'lensModel'] as String?),
      longitude: (json[r'longitude'] as num?)?.toDouble(),
      make: (json[r'make'] as String?),
      model: (json[r'model'] as String?),
      modifyDate: (json[r'modifyDate'] == null ? null : DateTime.parse(json[r'modifyDate'] as String)),
      orientation: (json[r'orientation'] as String?),
      projectionType: (json[r'projectionType'] as String?),
      rating: (json[r'rating'] as int?),
      state: (json[r'state'] as String?),
      timeZone: (json[r'timeZone'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (city != null) {
      json[r'city'] = city!;
    }
    if (country != null) {
      json[r'country'] = country!;
    }
    if (dateTimeOriginal != null) {
      json[r'dateTimeOriginal'] = dateTimeOriginal!.toUtc().toIso8601String();
    }
    if (description != null) {
      json[r'description'] = description!;
    }
    if (exifImageHeight != null) {
      json[r'exifImageHeight'] = exifImageHeight!;
    }
    if (exifImageWidth != null) {
      json[r'exifImageWidth'] = exifImageWidth!;
    }
    if (exposureTime != null) {
      json[r'exposureTime'] = exposureTime!;
    }
    if (fNumber != null) {
      json[r'fNumber'] = fNumber!;
    }
    if (fileSizeInByte != null) {
      json[r'fileSizeInByte'] = fileSizeInByte!;
    }
    if (focalLength != null) {
      json[r'focalLength'] = focalLength!;
    }
    if (iso != null) {
      json[r'iso'] = iso!;
    }
    if (latitude != null) {
      json[r'latitude'] = latitude!;
    }
    if (lensModel != null) {
      json[r'lensModel'] = lensModel!;
    }
    if (longitude != null) {
      json[r'longitude'] = longitude!;
    }
    if (make != null) {
      json[r'make'] = make!;
    }
    if (model != null) {
      json[r'model'] = model!;
    }
    if (modifyDate != null) {
      json[r'modifyDate'] = modifyDate!.toUtc().toIso8601String();
    }
    if (orientation != null) {
      json[r'orientation'] = orientation!;
    }
    if (projectionType != null) {
      json[r'projectionType'] = projectionType!;
    }
    if (rating != null) {
      json[r'rating'] = rating!;
    }
    if (state != null) {
      json[r'state'] = state!;
    }
    if (timeZone != null) {
      json[r'timeZone'] = timeZone!;
    }
    return json;
  }

  ExifResponseDto copyWith({
    Object? city = _undefined,
    Object? country = _undefined,
    Object? dateTimeOriginal = _undefined,
    Object? description = _undefined,
    Object? exifImageHeight = _undefined,
    Object? exifImageWidth = _undefined,
    Object? exposureTime = _undefined,
    Object? fNumber = _undefined,
    Object? fileSizeInByte = _undefined,
    Object? focalLength = _undefined,
    Object? iso = _undefined,
    Object? latitude = _undefined,
    Object? lensModel = _undefined,
    Object? longitude = _undefined,
    Object? make = _undefined,
    Object? model = _undefined,
    Object? modifyDate = _undefined,
    Object? orientation = _undefined,
    Object? projectionType = _undefined,
    Object? rating = _undefined,
    Object? state = _undefined,
    Object? timeZone = _undefined,
  }) {
    return .new(
      city: identical(city, _undefined) ? this.city : city as String?,
      country: identical(country, _undefined) ? this.country : country as String?,
      dateTimeOriginal: identical(dateTimeOriginal, _undefined) ? this.dateTimeOriginal : dateTimeOriginal as DateTime?,
      description: identical(description, _undefined) ? this.description : description as String?,
      exifImageHeight: identical(exifImageHeight, _undefined) ? this.exifImageHeight : exifImageHeight as int?,
      exifImageWidth: identical(exifImageWidth, _undefined) ? this.exifImageWidth : exifImageWidth as int?,
      exposureTime: identical(exposureTime, _undefined) ? this.exposureTime : exposureTime as String?,
      fNumber: identical(fNumber, _undefined) ? this.fNumber : fNumber as double?,
      fileSizeInByte: identical(fileSizeInByte, _undefined) ? this.fileSizeInByte : fileSizeInByte as int?,
      focalLength: identical(focalLength, _undefined) ? this.focalLength : focalLength as double?,
      iso: identical(iso, _undefined) ? this.iso : iso as int?,
      latitude: identical(latitude, _undefined) ? this.latitude : latitude as double?,
      lensModel: identical(lensModel, _undefined) ? this.lensModel : lensModel as String?,
      longitude: identical(longitude, _undefined) ? this.longitude : longitude as double?,
      make: identical(make, _undefined) ? this.make : make as String?,
      model: identical(model, _undefined) ? this.model : model as String?,
      modifyDate: identical(modifyDate, _undefined) ? this.modifyDate : modifyDate as DateTime?,
      orientation: identical(orientation, _undefined) ? this.orientation : orientation as String?,
      projectionType: identical(projectionType, _undefined) ? this.projectionType : projectionType as String?,
      rating: identical(rating, _undefined) ? this.rating : rating as int?,
      state: identical(state, _undefined) ? this.state : state as String?,
      timeZone: identical(timeZone, _undefined) ? this.timeZone : timeZone as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is ExifResponseDto &&
            city == other.city &&
            country == other.country &&
            dateTimeOriginal == other.dateTimeOriginal &&
            description == other.description &&
            exifImageHeight == other.exifImageHeight &&
            exifImageWidth == other.exifImageWidth &&
            exposureTime == other.exposureTime &&
            fNumber == other.fNumber &&
            fileSizeInByte == other.fileSizeInByte &&
            focalLength == other.focalLength &&
            iso == other.iso &&
            latitude == other.latitude &&
            lensModel == other.lensModel &&
            longitude == other.longitude &&
            make == other.make &&
            model == other.model &&
            modifyDate == other.modifyDate &&
            orientation == other.orientation &&
            projectionType == other.projectionType &&
            rating == other.rating &&
            state == other.state &&
            timeZone == other.timeZone);
  }

  @override
  int get hashCode {
    return Object.hashAll([
      city,
      country,
      dateTimeOriginal,
      description,
      exifImageHeight,
      exifImageWidth,
      exposureTime,
      fNumber,
      fileSizeInByte,
      focalLength,
      iso,
      latitude,
      lensModel,
      longitude,
      make,
      model,
      modifyDate,
      orientation,
      projectionType,
      rating,
      state,
      timeZone,
    ]);
  }

  @override
  String toString() =>
      'ExifResponseDto(city=$city, country=$country, dateTimeOriginal=$dateTimeOriginal, description=$description, exifImageHeight=$exifImageHeight, exifImageWidth=$exifImageWidth, exposureTime=$exposureTime, fNumber=$fNumber, fileSizeInByte=$fileSizeInByte, focalLength=$focalLength, iso=$iso, latitude=$latitude, lensModel=$lensModel, longitude=$longitude, make=$make, model=$model, modifyDate=$modifyDate, orientation=$orientation, projectionType=$projectionType, rating=$rating, state=$state, timeZone=$timeZone)';
}
