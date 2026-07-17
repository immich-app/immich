import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class FavoriteAction extends BaseAction {
  const FavoriteAction();

  @override
  IconData icon(_) => Icons.favorite_border_rounded;

  @override
  String label(context) => context.t.favorite;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      AssetFilter(assets).owned(currentUser(ref).id).favorite(isFavorite: false);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final ids = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);

    await ref.read(assetServiceProvider).update(ids, isFavorite: const .some(true));
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.favorite_action_prompt(count: ids.length));
  }
}

class UnfavoriteAction extends BaseAction {
  const UnfavoriteAction();

  @override
  IconData icon(_) => Icons.favorite_rounded;

  @override
  String label(context) => context.t.unfavorite;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) {
    final owned = AssetFilter(assets).owned(currentUser(ref).id);
    return owned.favorite(isFavorite: false).isEmpty ? owned : const [];
  }

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final ids = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);

    await ref.read(assetServiceProvider).update(ids, isFavorite: const .some(false));
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.unfavorite_action_prompt(count: ids.length));
  }
}
