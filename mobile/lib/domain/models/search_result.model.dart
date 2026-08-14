import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

part 'search_result.model.freezed.dart';

@Freezed(toStringOverride: false)
abstract class SearchResult with _$SearchResult {
  const SearchResult._();

  const factory SearchResult({required List<BaseAsset> assets, int? nextPage}) = _SearchResult;

  // Explicitly don't log results, only attributes
  @override
  String toString() => 'SearchResult(assets: ${assets.length}, nextPage: $nextPage)';
}
