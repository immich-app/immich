import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class StackAction extends BaseAction {
  const StackAction();

  @override
  IconData get icon => Icons.filter_none_rounded;

  @override
  String label(context) => context.t.stack;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      AssetFilter(assets).owned(currentUser(ref).id);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) {
    final owned = AssetFilter(assets).owned(currentUser(ref).id);
    // elementAtOrNull instead of length check to avoid iterating the entire list
    return owned.elementAtOrNull(1) != null && owned.stacked(isStacked: false).isNotEmpty;
  }

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final authUser = currentUser(ref);
    final ids = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);

    await ref.read(assetServiceProvider).stack(authUser.id, ids);
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.stacked_assets_count(count: ids.length));
  }
}

class UnstackAction extends BaseAction {
  const UnstackAction();

  @override
  IconData get icon => Icons.layers_clear_outlined;

  @override
  String label(context) => context.t.unstack;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) {
    final owned = AssetFilter(assets).owned(currentUser(ref).id);
    return owned.stacked(isStacked: false).isEmpty ? owned : const [];
  }

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final stacked = assetsForAction(ref, assets).toList(growable: false);
    final stackIds = stacked.map((asset) => asset.stackId).nonNulls.toList(growable: false);

    await ref.read(assetServiceProvider).unstack(stackIds);
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.unstacked_assets_count(count: stackIds.length));
  }
}
