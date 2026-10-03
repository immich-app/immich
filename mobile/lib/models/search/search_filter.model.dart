import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/utils/option.dart';

part 'search_filter.model.freezed.dart';

@freezed
abstract class SearchLocationFilter with _$SearchLocationFilter {
  const SearchLocationFilter._();

  const factory SearchLocationFilter({String? country, String? state, String? city}) = _SearchLocationFilter;
}

@freezed
abstract class SearchCameraFilter with _$SearchCameraFilter {
  const SearchCameraFilter._();

  const factory SearchCameraFilter({String? make, String? model}) = _SearchCameraFilter;
}

@freezed
abstract class SearchDateFilter with _$SearchDateFilter {
  const SearchDateFilter._();

  const factory SearchDateFilter({DateTime? takenBefore, DateTime? takenAfter}) = _SearchDateFilter;
}

@freezed
abstract class SearchRatingFilter with _$SearchRatingFilter {
  const SearchRatingFilter._();

  /// [rating]: none = no filter; some(null) = filter for unrated; some(1-5) = filter for that rating
  // TODO(agg23): Switch to enum
  const factory SearchRatingFilter({@Default(Option.none()) Option<int?> rating}) = _SearchRatingFilter;
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
