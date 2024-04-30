// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:openapi/api.dart';

class SearchLocationFilter {
  String? country;
  String? state;
  String? city;
  SearchLocationFilter({
    this.country,
    this.state,
    this.city,
  });

  SearchLocationFilter copyWith({
    String? country,
    String? state,
    String? city,
  }) {
    return SearchLocationFilter(
      country: country ?? this.country,
      state: state ?? this.state,
      city: city ?? this.city,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'country': country,
      'state': state,
      'city': city,
    };
  }

  factory SearchLocationFilter.fromMap(Map<String, dynamic> map) {
    return SearchLocationFilter(
      country: map['country'] != null ? map['country'] as String : null,
      state: map['state'] != null ? map['state'] as String : null,
      city: map['city'] != null ? map['city'] as String : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchLocationFilter.fromJson(String source) =>
      SearchLocationFilter.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'SearchLocationFilter(country: $country, state: $state, city: $city)';

  @override
  bool operator ==(covariant SearchLocationFilter other) {
    if (identical(this, other)) return true;

    return other.country == country &&
        other.state == state &&
        other.city == city;
  }

  @override
  int get hashCode => country.hashCode ^ state.hashCode ^ city.hashCode;
}

class SearchCameraFilter {
  String? make;
  String? model;
  SearchCameraFilter({
    this.make,
    this.model,
  });

  SearchCameraFilter copyWith({
    String? make,
    String? model,
  }) {
    return SearchCameraFilter(
      make: make ?? this.make,
      model: model ?? this.model,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'make': make,
      'model': model,
    };
  }

  factory SearchCameraFilter.fromMap(Map<String, dynamic> map) {
    return SearchCameraFilter(
      make: map['make'] != null ? map['make'] as String : null,
      model: map['model'] != null ? map['model'] as String : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchCameraFilter.fromJson(String source) =>
      SearchCameraFilter.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'SearchCameraFilter(make: $make, model: $model)';

  @override
  bool operator ==(covariant SearchCameraFilter other) {
    if (identical(this, other)) return true;

    return other.make == make && other.model == model;
  }

  @override
  int get hashCode => make.hashCode ^ model.hashCode;
}

class SearchDateFilter {
  DateTime? takenBefore;
  DateTime? takenAfter;
  SearchDateFilter({
    this.takenBefore,
    this.takenAfter,
  });

  SearchDateFilter copyWith({
    DateTime? takenBefore,
    DateTime? takenAfter,
  }) {
    return SearchDateFilter(
      takenBefore: takenBefore ?? this.takenBefore,
      takenAfter: takenAfter ?? this.takenAfter,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'takenBefore': takenBefore?.millisecondsSinceEpoch,
      'takenAfter': takenAfter?.millisecondsSinceEpoch,
    };
  }

  factory SearchDateFilter.fromMap(Map<String, dynamic> map) {
    return SearchDateFilter(
      takenBefore: map['takenBefore'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['takenBefore'] as int)
          : null,
      takenAfter: map['takenAfter'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['takenAfter'] as int)
          : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchDateFilter.fromJson(String source) =>
      SearchDateFilter.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'SearchDateFilter(takenBefore: $takenBefore, takenAfter: $takenAfter)';

  @override
  bool operator ==(covariant SearchDateFilter other) {
    if (identical(this, other)) return true;

    return other.takenBefore == takenBefore && other.takenAfter == takenAfter;
  }

  @override
  int get hashCode => takenBefore.hashCode ^ takenAfter.hashCode;
}

class SearchDisplayFilters {
  bool isNotInAlbum = false;
  bool isArchive = false;
  bool isFavorite = false;
  SearchDisplayFilters({
    required this.isNotInAlbum,
    required this.isArchive,
    required this.isFavorite,
  });

  SearchDisplayFilters copyWith({
    bool? isNotInAlbum,
    bool? isArchive,
    bool? isFavorite,
  }) {
    return SearchDisplayFilters(
      isNotInAlbum: isNotInAlbum ?? this.isNotInAlbum,
      isArchive: isArchive ?? this.isArchive,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'isNotInAlbum': isNotInAlbum,
      'isArchive': isArchive,
      'isFavorite': isFavorite,
    };
  }

  factory SearchDisplayFilters.fromMap(Map<String, dynamic> map) {
    return SearchDisplayFilters(
      isNotInAlbum: map['isNotInAlbum'] as bool,
      isArchive: map['isArchive'] as bool,
      isFavorite: map['isFavorite'] as bool,
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchDisplayFilters.fromJson(String source) =>
      SearchDisplayFilters.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'SearchDisplayFilters(isNotInAlbum: $isNotInAlbum, isArchive: $isArchive, isFavorite: $isFavorite)';

  @override
  bool operator ==(covariant SearchDisplayFilters other) {
    if (identical(this, other)) return true;

    return other.isNotInAlbum == isNotInAlbum &&
        other.isArchive == isArchive &&
        other.isFavorite == isFavorite;
  }

  @override
  int get hashCode =>
      isNotInAlbum.hashCode ^ isArchive.hashCode ^ isFavorite.hashCode;
}

class SearchFilter {
  String? context;
  String? filename;
  Set<PersonResponseDto> people;
  SearchLocationFilter location;
  SearchCameraFilter camera;
  SearchDateFilter date;
  SearchDisplayFilters display;

  // Enum
  AssetType mediaType;

  SearchFilter({
    this.context,
    this.filename,
    required this.people,
    required this.location,
    required this.camera,
    required this.date,
    required this.display,
    required this.mediaType,
  });

  SearchFilter copyWith({
    String? context,
    String? filename,
    Set<PersonResponseDto>? people,
    SearchLocationFilter? location,
    SearchCameraFilter? camera,
    SearchDateFilter? date,
    SearchDisplayFilters? display,
    AssetType? mediaType,
  }) {
    return SearchFilter(
      context: context ?? this.context,
      filename: filename ?? this.filename,
      people: people ?? this.people,
      location: location ?? this.location,
      camera: camera ?? this.camera,
      date: date ?? this.date,
      display: display ?? this.display,
      mediaType: mediaType ?? this.mediaType,
    );
  }

  @override
  String toString() {
    return 'SearchFilter(context: $context, filename: $filename, people: $people, location: $location, camera: $camera, date: $date, display: $display, mediaType: $mediaType)';
  }

  @override
  bool operator ==(covariant SearchFilter other) {
    if (identical(this, other)) return true;

    return other.context == context &&
        other.filename == filename &&
        other.people == people &&
        other.location == location &&
        other.camera == camera &&
        other.date == date &&
        other.display == display &&
        other.mediaType == mediaType;
  }

  @override
  int get hashCode {
    return context.hashCode ^
        filename.hashCode ^
        people.hashCode ^
        location.hashCode ^
        camera.hashCode ^
        date.hashCode ^
        display.hashCode ^
        mediaType.hashCode;
  }
}
