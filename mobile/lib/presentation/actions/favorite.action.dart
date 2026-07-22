import 'package:flutter/material.dart' hide Action;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/asset_action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:immich_ui/immich_ui.dart';

class FavoriteAction extends AssetAction {
  const FavoriteAction({super.key, super.display, super.source});

  @override
  Action resolve(BuildContext context, WidgetRef ref) {
    final (:assets, :clearSelect) = ref.watch(assetsActionProvider(source));
    final userId = ref.read(currentUserProvider)?.id;
    final targets = userId == null
        ? const <RemoteAsset>[]
        : AssetFilter(assets).owned(userId).favorite(isFavorite: false).toList(growable: false);

    return Action(
      icon: Icons.favorite_border_rounded,
      isVisible: targets.isNotEmpty,
      label: context.t.favorite,
      onAction: () async {
        final ids = targets.map((asset) => asset.id).toList(growable: false);
        await ref.read(assetServiceProvider).updateFavorite(ids, true);
        snackbar.success(StaticTranslations.instance.favorite_action_prompt(count: ids.length));
        clearSelect();
      },
    );
  }
}

class UnfavoriteAction extends AssetAction {
  const UnfavoriteAction({super.key, super.display, super.source});

  @override
  Action resolve(BuildContext context, WidgetRef ref) {
    final (:assets, :clearSelect) = ref.watch(assetsActionProvider(source));
    final userId = ref.read(currentUserProvider)?.id;
    final targets = userId == null
        ? const <RemoteAsset>[]
        : AssetFilter(assets).owned(userId).favorite(isFavorite: true).toList(growable: false);

    return Action(
      icon: Icons.favorite_rounded,
      isVisible: targets.isNotEmpty,
      label: context.t.unfavorite,
      onAction: () async {
        final ids = targets.map((asset) => asset.id).toList(growable: false);
        await ref.read(assetServiceProvider).updateFavorite(ids, false);
        snackbar.success(StaticTranslations.instance.unfavorite_action_prompt(count: ids.length));
        clearSelect();
      },
    );
  }
}
