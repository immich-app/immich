import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class SetAlbumCoverAction extends BaseAction {
  final String albumId;

  const SetAlbumCoverAction({required this.albumId});

  @override
  IconData icon(_) => Icons.image_outlined;

  @override
  String label(context) => context.t.set_as_album_cover;

  @visibleForTesting
  Iterable<String> assetsForAction(Iterable<BaseAsset> assets) =>
      AssetFilter(assets).map((asset) => asset.remoteId).nonNulls;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(assets).singleOrNull != null;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;

    await ref.read(remoteAlbumServiceProvider).updateAlbum(albumId, thumbnailAssetId: assetsForAction(assets).single);
    if (!context.mounted) {
      return;
    }
    ref.read(toastRepositoryProvider).success(context.t.album_cover_updated);
  }
}
