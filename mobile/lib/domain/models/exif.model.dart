class ExifInfo {
  final int? assetId;
  final int? fileSize;
  final String? description;
  final bool isFlipped;
  final String? orientation;
  final String? timeZone;
  final DateTime? dateTimeOriginal;
  final int? rating;

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
  final double? fps;
  final int? bitRate;
  final String? codec;

  bool get hasCoordinates => latitude != null && longitude != null && latitude != 0 && longitude != 0;

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

  String get focalLength => mm == null ? "" : mm!.toStringAsFixed(3);

  const ExifInfo({
    this.assetId,
    this.fileSize,
    this.description,
    this.orientation,
    this.timeZone,
    this.dateTimeOriginal,
    this.rating,
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
    this.fps,
    this.bitRate,
    this.codec,
  });

  @override
  bool operator ==(covariant ExifInfo other) {
    if (identical(this, other)) return true;

    return other.fileSize == fileSize &&
        other.description == description &&
        other.isFlipped == isFlipped &&
        other.orientation == orientation &&
        other.timeZone == timeZone &&
        other.dateTimeOriginal == dateTimeOriginal &&
        other.rating == rating &&
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
        other.fps == fps &&
        other.bitRate == bitRate &&
        other.codec == codec &&
        other.assetId == assetId;
  }

  @override
  int get hashCode {
    return fileSize.hashCode ^
        description.hashCode ^
        orientation.hashCode ^
        isFlipped.hashCode ^
        timeZone.hashCode ^
        dateTimeOriginal.hashCode ^
        rating.hashCode ^
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
        fps.hashCode ^
        bitRate.hashCode ^
        codec.hashCode ^
        assetId.hashCode;
  }

  @override
  String toString() {
    return '''{
fileSize: ${fileSize ?? 'NA'},
description: ${description ?? 'NA'},
orientation: ${orientation ?? 'NA'},
isFlipped: $isFlipped,
timeZone: ${timeZone ?? 'NA'},
dateTimeOriginal: ${dateTimeOriginal ?? 'NA'},
rating: ${rating ?? 'NA'},
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
fps: ${fps ?? 'NA'},
bitRate: ${bitRate ?? 'NA'},
codec: ${codec ?? 'NA'},
}''';
  }

  ExifInfo copyWith({
    int? assetId,
    int? fileSize,
    String? description,
    String? orientation,
    String? timeZone,
    DateTime? dateTimeOriginal,
    int? rating,
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
    double? fps,
    int? bitRate,
    String? codec,
  }) {
    return ExifInfo(
      assetId: assetId ?? this.assetId,
      fileSize: fileSize ?? this.fileSize,
      description: description ?? this.description,
      orientation: orientation ?? this.orientation,
      timeZone: timeZone ?? this.timeZone,
      dateTimeOriginal: dateTimeOriginal ?? this.dateTimeOriginal,
      rating: rating ?? this.rating,
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
      fps: fps ?? this.fps,
      bitRate: bitRate ?? this.bitRate,
      codec: codec ?? this.codec,
    );
  }
}
