import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class SimilarPhotosAction extends BaseAction {
  const SimilarPhotosAction();

  @override
  IconData get icon => Icons.compare;

  @override
  String label(context) => context.t.view_similar_photos;

  @visibleForTesting
  Iterable<RemoteAsset> assetForAction(Iterable<BaseAsset> assets) => AssetFilter(assets).remote();

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetForAction(assets).firstOrNull != null;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final asset = assetForAction(assets).first;
    final context = ref.context;

    ref.invalidate(assetViewerProvider);
    ref.invalidate(paginatedSearchProvider);

    ref.read(searchPreFilterProvider.notifier)
      ..clear()
      ..setFilter(
        .new(
          assetId: asset.id,
          people: {},
          location: .new(),
          camera: .new(),
          date: .new(),
          display: .new(isNotInAlbum: false, isArchive: false, isFavorite: false),
          rating: .new(),
          mediaType: .other,
        ),
      );

    unawaited(context.navigateTo(const DriftSearchRoute()));
  }
}
