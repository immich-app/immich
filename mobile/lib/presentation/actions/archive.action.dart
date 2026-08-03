import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

typedef _State = ({bool shouldArchive, List<String> assetIds});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  if (ref.watch(inLockedViewProvider)) {
    return null;
  }

  final assets = ref.watch(ownedAssetsActionProvider(source));
  final shouldArchive = assets.notVisibility(.archive).isNotEmpty;
  final assetIds = assets
      .visibility(shouldArchive ? .timeline : .archive)
      .map((asset) => asset.id)
      .toList(growable: false);
  return assetIds.isEmpty ? null : (shouldArchive: shouldArchive, assetIds: assetIds);
});

class ArchiveAction extends AssetActionBuilder {
  const ArchiveAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
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
    final assetService = ref.read(assetServiceProvider);
    final toastService = ref.read(toastServiceProvider);
    final clearSelection = ref.read(clearSelectionProvider(source));

    try {
      await assetService.update(assetIds, visibility: .some(shouldArchive ? .archive : .timeline));
      toastService.success(message);
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the archive status for assets");
    }
  }
}
