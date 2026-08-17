import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class SimilarPhotosAction extends ActionBuilder {
  final String assetId;

  const SimilarPhotosAction({required this.assetId});

  @override
  ActionItem create(BuildContext context, WidgetRef ref) =>
      .new(icon: Icons.compare, label: context.t.view_similar_photos, onAction: () => _search(context, ref));

  Future<void> _search(BuildContext context, WidgetRef ref) async {
    ref.invalidate(assetViewerProvider);
    ref.invalidate(paginatedSearchProvider);

    ref.read(searchPreFilterProvider.notifier)
      ..clear()
      ..setFilter(
        .new(
          assetId: assetId,
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
