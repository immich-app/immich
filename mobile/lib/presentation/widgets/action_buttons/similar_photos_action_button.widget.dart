import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class SimilarPhotosActionButton extends ConsumerWidget {
  final String assetId;

  const SimilarPhotosActionButton({super.key, required this.assetId});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    ref.invalidate(assetViewerProvider);
    ref
        .read(searchPreFilterProvider.notifier)
        .setFilter(
          SearchFilter(
            assetId: assetId,
            people: {},
            location: SearchLocationFilter(),
            camera: SearchCameraFilter(),
            date: SearchDateFilter(),
            display: SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
            mediaType: AssetType.image,
          ),
        );

    /// Using and currentTabIndex to make sure we are using the correct
    /// navigation behavior. We want to be able to navigate back to the
    /// main timline using View In Timeline button without the need of
    /// waiting for the timeline to be rebuild. At the same time, we want
    /// to refresh the search page when tapping the Similar Photos button
    /// while already in the Search tab.
    final currentTabIndex = (ref.read(currentTabIndexProvider.notifier).state);

    if (currentTabIndex != kSearchTabIndex) {
      unawaited(context.router.navigate(const DriftSearchRoute()));
      ref.read(currentTabIndexProvider.notifier).state = kSearchTabIndex;
    } else {
      unawaited(context.router.popAndPush(const DriftSearchRoute()));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.compare,
      label: "view_similar_photos".t(context: context),
      onPressed: () => _onTap(context, ref),
      maxWidth: 100,
    );
  }
}
