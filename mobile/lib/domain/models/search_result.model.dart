import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

class SearchResult {
  final List<BaseAsset> assets;
  final double scrollOffset;
  final int? nextPage;

  const SearchResult({required this.assets, this.scrollOffset = 0.0, this.nextPage});

  SearchResult copyWith({List<BaseAsset>? assets, int? nextPage, double? scrollOffset}) {
    return SearchResult(
      assets: assets ?? this.assets,
      nextPage: nextPage ?? this.nextPage,
      scrollOffset: scrollOffset ?? this.scrollOffset,
    );
  }

  @override
  String toString() => 'SearchResult(assets: ${assets.length}, nextPage: $nextPage, scrollOffset: $scrollOffset)';

  @override
  bool operator ==(covariant SearchResult other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.assets, assets) && other.nextPage == nextPage && other.scrollOffset == scrollOffset;
  }

  @override
  int get hashCode => assets.hashCode ^ nextPage.hashCode ^ scrollOffset.hashCode;
}
