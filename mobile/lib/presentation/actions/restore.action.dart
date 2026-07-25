import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

final _stateProvider = Provider.family.autoDispose<List<String>?, ActionSource>((ref, source) {
  final AssetsActionState(:ownedAssets) = ref.watch(assetsActionProvider(source));
  final assetIds = ownedAssets.trashed().map((asset) => asset.id).toList(growable: false);
  return assetIds.isEmpty ? null : assetIds;
});

class RestoreAction extends AssetActionBuilder {
  const RestoreAction({required super.source});

  @override
  ActionData? build(BuildContext context, WidgetRef ref) {
    if (!ref.watch(_stateProvider(source).select((state) => state != null))) {
      return null;
    }

    return .new(icon: Icons.history_rounded, label: context.t.restore, onAction: () => _restore(context, ref));
  }

  Future<void> _restore(BuildContext context, WidgetRef ref) async {
    final assetIds = ref.read(_stateProvider(source));
    if (assetIds == null) {
      return;
    }

    final message = context.t.assets_restored_count(count: assetIds.length);
    final toast = ref.read(toastRepositoryProvider);
    final selection = ref.read(assetsActionProvider(source).notifier);

    try {
      await ref.read(assetServiceProvider).restoreTrash(assetIds);
      toast.success(message);
      selection.clearSelect();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to restore assets");
    }
  }
}
