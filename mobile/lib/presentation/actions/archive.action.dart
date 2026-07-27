import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

typedef _State = ({bool shouldArchive, List<String> assetIds});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  final AssetsActionState(:ownedAssets) = ref.watch(assetsActionProvider(source));
  final shouldArchive = ownedAssets.notVisibility(.archive).isNotEmpty;
  final assetIds = ownedAssets
      .visibility(shouldArchive ? .timeline : .archive)
      .map((asset) => asset.id)
      .toList(growable: false);
  return assetIds.isEmpty ? null : (shouldArchive: shouldArchive, assetIds: assetIds);
});

class ArchiveAction extends AssetActionBuilder {
  const ArchiveAction({required super.source});

  @override
  ActionData? build(BuildContext context, WidgetRef ref) {
    final shouldArchive = ref.watch(_stateProvider(source).select((state) => state?.shouldArchive));
    if (shouldArchive == null) {
      return null;
    }

    return .new(
      icon: shouldArchive ? Icons.archive_outlined : Icons.unarchive_outlined,
      label: shouldArchive ? context.t.archive : context.t.unarchive,
      onAction: () => _archive(context, ref),
    );
  }

  Future<void> _archive(BuildContext context, WidgetRef ref) async {
    final state = ref.read(_stateProvider(source));
    if (state == null) {
      return;
    }

    final (:shouldArchive, :assetIds) = state;
    final message = shouldArchive
        ? context.t.archive_action_prompt(count: assetIds.length)
        : context.t.unarchive_action_prompt(count: assetIds.length);
    final service = ref.read(assetServiceProvider);
    final toast = ref.read(toastRepositoryProvider);
    final selection = ref.read(assetsActionProvider(source).notifier);

    try {
      await service.update(assetIds, visibility: .some(shouldArchive ? .archive : .timeline));
      toast.success(
        message,
        toast: .new(onUndo: () => service.update(assetIds, visibility: .some(shouldArchive ? .timeline : .archive))),
      );
      selection.clearSelect();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the archive status for assets");
    }
  }
}
