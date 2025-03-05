class ExifInfo {
  final int? assetId;
  final int? fileSize;
  final String? description;
  final bool isFlipped;
  final String? orientation;
  final String? timeZone;
  final DateTime? dateTimeOriginal;

  // GPS
  final double? latitude;
  final double? longitude;
  final String? city;
  final String? state;
  final String? country;

  // Camera related
  final String? make;
  final String? model;
  final String? lens;
  final double? f;
  final double? mm;
  final int? iso;
  final double? exposureSeconds;

  bool get hasCoordinates =>
      latitude != null && longitude != null && latitude != 0 && longitude != 0;

  String get exposureTime {
    if (exposureSeconds == null) {
      return "";
    }
    if (exposureSeconds! < 1) {
      return "1/${(1.0 / exposureSeconds!).round()} s";
    }
    return "${exposureSeconds!.toStringAsFixed(1)} s";
  }

  String get fNumber => f == null ? "" : f!.toStringAsFixed(1);

  String get focalLength => mm == null ? "" : mm!.toStringAsFixed(1);

  const ExifInfo({
    this.assetId,
    this.fileSize,
    this.description,
    this.orientation,
    this.timeZone,
    this.dateTimeOriginal,
    this.isFlipped = false,
    this.latitude,
    this.longitude,
    this.city,
    this.state,
    this.country,
    this.make,
    this.model,
    this.lens,
    this.f,
    this.mm,
    this.iso,
    this.exposureSeconds,
  });

  @override
  bool operator ==(covariant ExifInfo other) {
    if (identical(this, other)) return true;

    return other.fileSize == fileSize &&
        other.description == description &&
        other.orientation == orientation &&
        other.timeZone == timeZone &&
        other.dateTimeOriginal == dateTimeOriginal &&
        other.latitude == latitude &&
        other.longitude == longitude &&
        other.city == city &&
        other.state == state &&
        other.country == country &&
        other.make == make &&
        other.model == model &&
        other.lens == lens &&
        other.f == f &&
        other.mm == mm &&
        other.iso == iso &&
        other.exposureSeconds == exposureSeconds &&
        other.assetId == assetId;
  }

  @override
  int get hashCode {
    return fileSize.hashCode ^
        description.hashCode ^
        orientation.hashCode ^
        timeZone.hashCode ^
        dateTimeOriginal.hashCode ^
        latitude.hashCode ^
        longitude.hashCode ^
        city.hashCode ^
        state.hashCode ^
        country.hashCode ^
        make.hashCode ^
        model.hashCode ^
        lens.hashCode ^
        f.hashCode ^
        mm.hashCode ^
        iso.hashCode ^
        exposureSeconds.hashCode ^
        assetId.hashCode;
  }

  @override
  String toString() {
    return '''{
fileSize: ${fileSize ?? 'NA'},
description: ${description ?? 'NA'},
orientation: ${orientation ?? 'NA'},
timeZone: ${timeZone ?? 'NA'},
dateTimeOriginal: ${dateTimeOriginal ?? 'NA'},
latitude: ${latitude ?? 'NA'},
longitude: ${longitude ?? 'NA'},
city: ${city ?? 'NA'},
state: ${state ?? 'NA'},
country: ${country ?? '<NA>'},
make: ${make ?? 'NA'},
model: ${model ?? 'NA'},
lens: ${lens ?? 'NA'},
f: ${f ?? 'NA'},
mm: ${mm ?? '<NA>'},
iso: ${iso ?? 'NA'},
exposureSeconds: ${exposureSeconds ?? 'NA'},
}''';
  }

  ExifInfo copyWith({
    int? assetId,
    int? fileSize,
    String? description,
    String? orientation,
    String? timeZone,
    DateTime? dateTimeOriginal,
    double? latitude,
    double? longitude,
    String? city,
    String? state,
    String? country,
    bool? isFlipped,
    String? make,
    String? model,
    String? lens,
    double? f,
    double? mm,
    int? iso,
    double? exposureSeconds,
  }) {
    return ExifInfo(
      assetId: assetId ?? this.assetId,
      fileSize: fileSize ?? this.fileSize,
      description: description ?? this.description,
      orientation: orientation ?? this.orientation,
      timeZone: timeZone ?? this.timeZone,
      dateTimeOriginal: dateTimeOriginal ?? this.dateTimeOriginal,
      isFlipped: isFlipped ?? this.isFlipped,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      make: make ?? this.make,
      model: model ?? this.model,
      lens: lens ?? this.lens,
      f: f ?? this.f,
      mm: mm ?? this.mm,
      iso: iso ?? this.iso,
      exposureSeconds: exposureSeconds ?? this.exposureSeconds,
    );
  }
}
