import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class SetAlbumCoverAction extends BaseAction {
  final String albumId;
  final List<String> assetIds;

  SetAlbumCoverAction._({required super.scope, required this.albumId, required this.assetIds, super.isVisible})
    : super(icon: Icons.image_outlined, label: scope.context.t.set_as_album_cover);

  factory SetAlbumCoverAction({
    required Iterable<BaseAsset> assets,
    required String albumId,
    required ActionScope scope,
  }) {
    final assetIds = AssetFilter(assets).remote().map((asset) => asset.id).toList(growable: false);

    return SetAlbumCoverAction._(scope: scope, albumId: albumId, assetIds: assetIds, isVisible: assetIds.length == 1);
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;

    await ref.read(remoteAlbumServiceProvider).updateAlbum(albumId, thumbnailAssetId: assetIds.first);
    ref.read(toastRepositoryProvider).success(context.t.album_cover_updated);
  }
}
