import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class SimilarPhotosAction extends BaseAction {
  final String assetId;

  SimilarPhotosAction({required this.assetId, required super.scope})
    : super(icon: Icons.compare, label: scope.context.t.view_similar_photos);

  @override
  Future<void> onAction() async {
    final ActionScope(:context, :ref) = scope;

    ref.invalidate(assetViewerProvider);
    ref.invalidate(paginatedSearchProvider);

    ref.read(searchPreFilterProvider.notifier)
      ..clear()
      ..setFilter(
        SearchFilter(
          assetId: assetId,
          people: {},
          location: SearchLocationFilter(),
          camera: SearchCameraFilter(),
          date: SearchDateFilter(),
          display: SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
          rating: SearchRatingFilter(),
          mediaType: AssetType.other,
        ),
      );

    unawaited(context.navigateTo(const DriftSearchRoute()));
  }
}
