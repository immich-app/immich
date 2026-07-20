import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class ArchiveAction extends BaseAction {
  const ArchiveAction();

  @override
  IconData get icon => Icons.archive_outlined;

  @override
  String label(context) => context.t.archive;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(ref, assets) =>
      AssetFilter(assets).owned(currentUser(ref).id).archived(isArchived: false);

  @override
  bool isVisible(ref, assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(ref, assets) async {
    final context = ref.context;

    final ids = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).update(ids, visibility: const .some(.archive));
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.archive_action_prompt(count: ids.length));
  }
}

class UnarchiveAction extends BaseAction {
  const UnarchiveAction();

  @override
  IconData get icon => Icons.unarchive_outlined;

  @override
  String label(context) => context.t.unarchive;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(ref, assets) {
    final owned = AssetFilter(assets).owned(currentUser(ref).id);
    return owned.archived(isArchived: false).isEmpty ? owned : const [];
  }

  @override
  bool isVisible(ref, assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(ref, assets) async {
    final context = ref.context;

    final ids = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).update(ids, visibility: const .some(.timeline));
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.unarchive_action_prompt(count: ids.length));
  }
}
