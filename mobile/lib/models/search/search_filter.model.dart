import 'dart:convert';

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/utils/option.dart';

part 'search_filter.model.freezed.dart';

@Freezed(fromJson: false, toJson: false)
abstract class SearchLocationFilter with _$SearchLocationFilter {
  const SearchLocationFilter._();

  const factory SearchLocationFilter({String? country, String? state, String? city}) = _SearchLocationFilter;

  Map<String, dynamic> toMap() {
    return <String, dynamic>{'country': country, 'state': state, 'city': city};
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
}

@Freezed(fromJson: false, toJson: false)
abstract class SearchCameraFilter with _$SearchCameraFilter {
  const SearchCameraFilter._();

  const factory SearchCameraFilter({String? make, String? model}) = _SearchCameraFilter;

  Map<String, dynamic> toMap() {
    return <String, dynamic>{'make': make, 'model': model};
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
}

@Freezed(fromJson: false, toJson: false)
abstract class SearchDateFilter with _$SearchDateFilter {
  const SearchDateFilter._();

  const factory SearchDateFilter({DateTime? takenBefore, DateTime? takenAfter}) = _SearchDateFilter;

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'takenBefore': takenBefore?.millisecondsSinceEpoch,
      'takenAfter': takenAfter?.millisecondsSinceEpoch,
    };
  }

  factory SearchDateFilter.fromMap(Map<String, dynamic> map) {
    return SearchDateFilter(
      takenBefore: map['takenBefore'] != null ? DateTime.fromMillisecondsSinceEpoch(map['takenBefore'] as int) : null,
      takenAfter: map['takenAfter'] != null ? DateTime.fromMillisecondsSinceEpoch(map['takenAfter'] as int) : null,
    );
  }

  String toJson() => json.encode(toMap());

  factory SearchDateFilter.fromJson(String source) =>
      SearchDateFilter.fromMap(json.decode(source) as Map<String, dynamic>);
}

@Freezed(fromJson: false, toJson: false)
abstract class SearchRatingFilter with _$SearchRatingFilter {
  const SearchRatingFilter._();

  /// [rating]: none = no filter; some(null) = filter for unrated; some(1-5) = filter for that rating
  // TODO(agg23): Switch to enum
  const factory SearchRatingFilter({@Default(Option.none()) Option<int?> rating}) = _SearchRatingFilter;

  Map<String, dynamic> toMap() {
    if (rating.isNone) {
      return <String, dynamic>{'active': false};
    }
    return <String, dynamic>{'active': true, 'value': rating.unwrapOrNull};
  }

  factory SearchRatingFilter.fromMap(Map<String, dynamic> map) {
    if (!(map['active'] as bool? ?? false)) {
      return const SearchRatingFilter();
    }
    return SearchRatingFilter(rating: Option.some(map['value'] as int?));
  }

  String toJson() => json.encode(toMap());

  factory SearchRatingFilter.fromJson(String source) =>
      SearchRatingFilter.fromMap(json.decode(source) as Map<String, dynamic>);
}

@freezed
abstract class SearchDisplayFilters with _$SearchDisplayFilters {
  const factory SearchDisplayFilters({required bool isNotInAlbum, required bool isArchive, required bool isFavorite}) =
      _SearchDisplayFilters;
}

@freezed
abstract class SearchFilter with _$SearchFilter {
  const SearchFilter._();

  const factory SearchFilter({
    String? context,
    String? filename,
    String? description,
    String? ocr,
    String? language,
    String? assetId,
    List<String>? tagIds,
    required Set<Person> people,
    required SearchLocationFilter location,
    required SearchCameraFilter camera,
    required SearchDateFilter date,
    required SearchRatingFilter rating,
    required SearchDisplayFilters display,
    required AssetType mediaType,
  }) = _SearchFilter;

  bool get isEmpty {
    return (context == null || (context != null && context!.isEmpty)) &&
        (filename == null || (filename!.isEmpty)) &&
        (description == null || (description!.isEmpty)) &&
        (assetId == null || (assetId!.isEmpty)) &&
        (ocr == null || (ocr!.isEmpty)) &&
        (tagIds ?? []).isEmpty &&
        people.isEmpty &&
        location.country == null &&
        location.state == null &&
        location.city == null &&
        camera.make == null &&
        camera.model == null &&
        date.takenBefore == null &&
        date.takenAfter == null &&
        display.isNotInAlbum == false &&
        display.isArchive == false &&
        display.isFavorite == false &&
        rating.rating.isNone &&
        mediaType == AssetType.other;
  }
}
