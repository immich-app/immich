import 'package:collection/collection.dart';

import 'package:immich_mobile/entities/asset.entity.dart';

class SearchResult {
  final List<Asset> assets;
  final int? nextPage;

  SearchResult({
    required this.assets,
    this.nextPage,
  });

  SearchResult copyWith({
    List<Asset>? assets,
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
