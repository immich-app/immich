import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class RemoveFromAlbumAction extends BaseAction {
  final String albumId;

  const RemoveFromAlbumAction({required this.albumId});

  @override
  IconData get icon => Icons.remove_circle_outline;

  @override
  String label(context) => context.t.remove_from_album;

  @visibleForTesting
  Iterable<String> assetsForAction(Iterable<BaseAsset> assets) =>
      AssetFilter(assets).map((asset) => asset.remoteId).nonNulls;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final ids = assetsForAction(assets).toList(growable: false);

    final count = await ref.read(remoteAlbumServiceProvider).removeAssets(albumId: albumId, assetIds: ids);
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.remove_from_album_action_prompt(count: count));
  }
}
