// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

part 'search_result.model.freezed.dart';

@Freezed(toStringOverride: false)
class const SearchResult({required final List<BaseAsset> assets, final int? nextPage}) with _$SearchResult {
  // Explicitly don't log results, only attributes
  @override
  String toString() => 'SearchResult(assets: ${assets.length}, nextPage: $nextPage)';
}
