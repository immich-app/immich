import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

final _stateProvider = Provider.family.autoDispose<List<String>?, ActionSource>((ref, source) {
  final AssetsActionState(:assets) = ref.watch(assetsActionProvider(source));
  final assetIds = assets.remote().map((asset) => asset.id).toList(growable: false);
  return assetIds.isEmpty ? null : assetIds;
});

class RemoveFromAlbumAction extends AssetActionBuilder {
  final String albumId;

  const RemoveFromAlbumAction({required super.source, required this.albumId});

  @override
  ActionData? build(BuildContext context, WidgetRef ref) {
    final assetIds = ref.watch(_stateProvider(source));
    if (assetIds == null) {
      return null;
    }

    return .new(
      icon: Icons.remove_circle_outline,
      label: context.t.remove_from_album,
      onAction: () => _remove(context, ref, assetIds),
    );
  }

  Future<void> _remove(BuildContext context, WidgetRef ref, List<String> assetIds) async {
    final albumService = ref.read(remoteAlbumServiceProvider);
    final toast = ref.read(toastRepositoryProvider);
    final selection = ref.read(assetsActionProvider(source).notifier);

    try {
      final count = await albumService.removeAssets(albumId: albumId, assetIds: assetIds);
      if (!context.mounted) {
        return;
      }

      toast.success(context.t.remove_from_album_action_prompt(count: count));
      selection.clearSelect();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to remove the assets from the album");
    }
  }
}
