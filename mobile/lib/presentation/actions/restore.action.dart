import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class RestoreAction extends BaseAction {
  const RestoreAction();

  @override
  IconData get icon => Icons.history_rounded;

  @override
  String label(context) => context.t.restore;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      AssetFilter(assets).owned(currentUser(ref).id).trashed();

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(ref, assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final ids = assetsForAction(ref, assets).map((asset) => asset.id).toList(growable: false);

    final assetService = ref.read(assetServiceProvider);
    await assetService.restoreTrash(ids);
    if (!context.mounted) {
      return;
    }
    ref
        .read(toastRepositoryProvider)
        .success(
          context.t.assets_restored_count(count: ids.length),
          toast: .new(onUndo: () async => await assetService.trash(ids)),
        );
  }
}
