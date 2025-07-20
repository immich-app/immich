import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

class SearchResult {
  final List<BaseAsset> assets;
  final int? nextPage;

  const SearchResult({
    required this.assets,
    this.nextPage,
  });

  int get totalAssets => assets.length;

  SearchResult copyWith({
    List<BaseAsset>? assets,
    int? nextPage,
  }) {
    return SearchResult(
      assets: assets ?? this.assets,
      nextPage: nextPage ?? this.nextPage,
    );
  }

  @override
  String toString() => 'SearchResult(assets: $assets, nextPage: $nextPage)';

  @override
  bool operator ==(covariant SearchResult other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return listEquals(other.assets, assets) && other.nextPage == nextPage;
  }

  @override
  int get hashCode => assets.hashCode ^ nextPage.hashCode;
}
