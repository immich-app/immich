import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/routing/router.dart';

class SimilarPhotosActionButton extends ConsumerWidget {
  final String assetId;

  const SimilarPhotosActionButton({super.key, required this.assetId});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    context.pushRoute(
      DriftSearchRoute(
        preFilter: SearchFilter(
          assetId: assetId,
          people: {},
          location: SearchLocationFilter(),
          camera: SearchCameraFilter(),
          date: SearchDateFilter(),
          display: SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
          mediaType: AssetType.image,
        ),
      ),
    );
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
