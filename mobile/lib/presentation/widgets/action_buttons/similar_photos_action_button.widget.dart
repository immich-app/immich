import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/routing/router.dart';

class SimilarPhotosActionButton extends ConsumerWidget {
  final String assetId;
  final bool iconOnly;
  final bool menuItem;

  const SimilarPhotosActionButton({super.key, required this.assetId, this.iconOnly = false, this.menuItem = false});

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

    unawaited(context.navigateTo(const DriftSearchRoute()));
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.compare,
      label: "view_similar_photos".t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
      maxWidth: 100,
    );
  }
}
