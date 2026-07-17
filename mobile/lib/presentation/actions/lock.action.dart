import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class LockAction extends BaseAction {
  const LockAction();

  @override
  IconData icon(_) => Icons.lock_rounded;

  @override
  String label(context) => context.t.move_to_locked_folder;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      AssetFilter(assets).owned(currentUser(ref).id).locked(isLocked: false);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final ids = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);

    await ref.read(assetServiceProvider).update(ids, visibility: const .some(.locked));
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.move_to_lock_folder_action_prompt(count: ids.length));
  }
}

class UnlockAction extends BaseAction {
  const UnlockAction();

  @override
  IconData icon(_) => Icons.lock_open_rounded;

  @override
  String label(context) => context.t.remove_from_locked_folder;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) {
    final owned = AssetFilter(assets).owned(currentUser(ref).id);
    return owned.locked(isLocked: false).isEmpty ? owned : const [];
  }

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final ids = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);

    await ref.read(assetServiceProvider).update(ids, visibility: const .some(.timeline));
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.remove_from_lock_folder_action_prompt(count: ids.length));
  }
}
