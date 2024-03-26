// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:collection/collection.dart';

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
  Set<String> personIds;
  SearchLocationFilter location;
  SearchCameraFilter camera;
  SearchDateFilter date;
  SearchDisplayFilters display;

  SearchFilter({
    this.context,
    this.filename,
    required this.personIds,
    required this.location,
    required this.camera,
    required this.date,
    required this.display,
  });

  SearchFilter copyWith({
    String? context,
    String? filename,
    Set<String>? personIds,
    SearchLocationFilter? location,
    SearchCameraFilter? camera,
    SearchDateFilter? date,
    SearchDisplayFilters? display,
  }) {
    return SearchFilter(
      context: context ?? this.context,
      filename: filename ?? this.filename,
      personIds: personIds ?? this.personIds,
      location: location ?? this.location,
      camera: camera ?? this.camera,
      date: date ?? this.date,
      display: display ?? this.display,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'context': context,
      'filename': filename,
      'personIds': personIds.toList(),
      'location': location.toMap(),
      'camera': camera.toMap(),
      'date': date.toMap(),
      'display': display.toMap(),
    };
  }

  String toJson() => json.encode(toMap());

  @override
  String toString() {
    return 'SearchFilter(context: $context, filename: $filename, personIds: $personIds, location: $location, camera: $camera, date: $date, display: $display)';
  }

  @override
  bool operator ==(covariant SearchFilter other) {
    if (identical(this, other)) return true;
    final setEquals = const DeepCollectionEquality().equals;

    return other.context == context &&
        other.filename == filename &&
        setEquals(other.personIds, personIds) &&
        other.location == location &&
        other.camera == camera &&
        other.date == date &&
        other.display == display;
  }

  @override
  int get hashCode {
    return context.hashCode ^
        filename.hashCode ^
        personIds.hashCode ^
        location.hashCode ^
        camera.hashCode ^
        date.hashCode ^
        display.hashCode;
  }
}
