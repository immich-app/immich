import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

final _stateProvider = Provider.family.autoDispose<String?, ActionSource>((ref, source) {
  final assets = ref.watch(assetsActionProvider(source));
  return assets.remote().map((asset) => asset.id).singleOrNull;
});

class SetAlbumCoverAction extends AssetActionBuilder {
  final String albumId;

  const SetAlbumCoverAction({required super.source, required this.albumId});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final assetId = ref.watch(_stateProvider(source));
    if (assetId == null) {
      return null;
    }

    return .new(
      icon: Icons.image_outlined,
      label: context.t.set_as_album_cover,
      onAction: () => _setCover(context, ref, assetId),
    );
  }

  Future<void> _setCover(BuildContext context, WidgetRef ref, String assetId) async {
    final message = context.t.album_cover_updated;
    final albumService = ref.read(remoteAlbumServiceProvider);
    final toastService = ref.read(toastServiceProvider);
    final clearSelection = ref.read(clearSelectionProvider(source));

    try {
      await albumService.updateAlbum(albumId, thumbnailAssetId: assetId);
      toastService.success(message);
      clearSelection();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update the album cover");
    }
  }
}
