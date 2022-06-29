import 'dart:convert';

class ImmichExif {
  final int? id;
  final String? assetId;
  final String? make;
  final String? model;
  final String? imageName;
  final int? exifImageWidth;
  final int? exifImageHeight;
  final int? fileSizeInByte;
  final String? orientation;
  final String? dateTimeOriginal;
  final String? modifyDate;
  final String? lensModel;
  final double? fNumber;
  final double? focalLength;
  final int? iso;
  final double? exposureTime;
  final double? latitude;
  final double? longitude;
  final String? city;
  final String? state;
  final String? country;

  ImmichExif({
    this.id,
    this.assetId,
    this.make,
    this.model,
    this.imageName,
    this.exifImageWidth,
    this.exifImageHeight,
    this.fileSizeInByte,
    this.orientation,
    this.dateTimeOriginal,
    this.modifyDate,
    this.lensModel,
    this.fNumber,
    this.focalLength,
    this.iso,
    this.exposureTime,
    this.latitude,
    this.longitude,
    this.city,
    this.state,
    this.country,
  });

  ImmichExif copyWith({
    int? id,
    String? assetId,
    String? make,
    String? model,
    String? imageName,
    int? exifImageWidth,
    int? exifImageHeight,
    int? fileSizeInByte,
    String? orientation,
    String? dateTimeOriginal,
    String? modifyDate,
    String? lensModel,
    double? fNumber,
    double? focalLength,
    int? iso,
    double? exposureTime,
    double? latitude,
    double? longitude,
    String? city,
    String? state,
    String? country,
  }) {
    return ImmichExif(
      id: id ?? this.id,
      assetId: assetId ?? this.assetId,
      make: make ?? this.make,
      model: model ?? this.model,
      imageName: imageName ?? this.imageName,
      exifImageWidth: exifImageWidth ?? this.exifImageWidth,
      exifImageHeight: exifImageHeight ?? this.exifImageHeight,
      fileSizeInByte: fileSizeInByte ?? this.fileSizeInByte,
      orientation: orientation ?? this.orientation,
      dateTimeOriginal: dateTimeOriginal ?? this.dateTimeOriginal,
      modifyDate: modifyDate ?? this.modifyDate,
      lensModel: lensModel ?? this.lensModel,
      fNumber: fNumber ?? this.fNumber,
      focalLength: focalLength ?? this.focalLength,
      iso: iso ?? this.iso,
      exposureTime: exposureTime ?? this.exposureTime,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'assetId': assetId,
      'make': make,
      'model': model,
      'imageName': imageName,
      'exifImageWidth': exifImageWidth,
      'exifImageHeight': exifImageHeight,
      'fileSizeInByte': fileSizeInByte,
      'orientation': orientation,
      'dateTimeOriginal': dateTimeOriginal,
      'modifyDate': modifyDate,
      'lensModel': lensModel,
      'fNumber': fNumber,
      'focalLength': focalLength,
      'iso': iso,
      'exposureTime': exposureTime,
      'latitude': latitude,
      'longitude': longitude,
      'city': city,
      'state': state,
      'country': country,
    };
  }

  factory ImmichExif.fromMap(Map<String, dynamic> map) {
    return ImmichExif(
      id: map['id']?.toInt(),
      assetId: map['assetId'],
      make: map['make'],
      model: map['model'],
      imageName: map['imageName'],
      exifImageWidth: map['exifImageWidth']?.toInt(),
      exifImageHeight: map['exifImageHeight']?.toInt(),
      fileSizeInByte: map['fileSizeInByte']?.toInt(),
      orientation: map['orientation'],
      dateTimeOriginal: map['dateTimeOriginal'],
      modifyDate: map['modifyDate'],
      lensModel: map['lensModel'],
      fNumber: map['fNumber']?.toDouble(),
      focalLength: map['focalLength']?.toDouble(),
      iso: map['iso']?.toInt(),
      exposureTime: map['exposureTime']?.toDouble(),
      latitude: map['latitude']?.toDouble(),
      longitude: map['longitude']?.toDouble(),
      city: map['city'],
      state: map['state'],
      country: map['country'],
    );
  }

  String toJson() => json.encode(toMap());

  factory ImmichExif.fromJson(String source) =>
      ImmichExif.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ImmichExif(id: $id, assetId: $assetId, make: $make, model: $model, imageName: $imageName, exifImageWidth: $exifImageWidth, exifImageHeight: $exifImageHeight, fileSizeInByte: $fileSizeInByte, orientation: $orientation, dateTimeOriginal: $dateTimeOriginal, modifyDate: $modifyDate, lensModel: $lensModel, fNumber: $fNumber, focalLength: $focalLength, iso: $iso, exposureTime: $exposureTime, latitude: $latitude, longitude: $longitude, city: $city, state: $state, country: $country)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ImmichExif &&
        other.id == id &&
        other.assetId == assetId &&
        other.make == make &&
        other.model == model &&
        other.imageName == imageName &&
        other.exifImageWidth == exifImageWidth &&
        other.exifImageHeight == exifImageHeight &&
        other.fileSizeInByte == fileSizeInByte &&
        other.orientation == orientation &&
        other.dateTimeOriginal == dateTimeOriginal &&
        other.modifyDate == modifyDate &&
        other.lensModel == lensModel &&
        other.fNumber == fNumber &&
        other.focalLength == focalLength &&
        other.iso == iso &&
        other.exposureTime == exposureTime &&
        other.latitude == latitude &&
        other.longitude == longitude &&
        other.city == city &&
        other.state == state &&
        other.country == country;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        assetId.hashCode ^
        make.hashCode ^
        model.hashCode ^
        imageName.hashCode ^
        exifImageWidth.hashCode ^
        exifImageHeight.hashCode ^
        fileSizeInByte.hashCode ^
        orientation.hashCode ^
        dateTimeOriginal.hashCode ^
        modifyDate.hashCode ^
        lensModel.hashCode ^
        fNumber.hashCode ^
        focalLength.hashCode ^
        iso.hashCode ^
        exposureTime.hashCode ^
        latitude.hashCode ^
        longitude.hashCode ^
        city.hashCode ^
        state.hashCode ^
        country.hashCode;
  }
}
