import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class RemoveFromAlbumAction extends BaseAction {
  final String albumId;
  final List<String> assetIds;

  RemoveFromAlbumAction._({required super.scope, required this.albumId, required this.assetIds, super.isVisible})
    : super(icon: Icons.remove_circle_outline, label: scope.context.t.remove_from_album);

  factory RemoveFromAlbumAction({
    required Iterable<BaseAsset> assets,
    required String albumId,
    required ActionScope scope,
  }) {
    final assetIds = AssetFilter(assets).map((asset) => asset.remoteId).nonNulls.toList(growable: false);

    return RemoveFromAlbumAction._(scope: scope, albumId: albumId, assetIds: assetIds, isVisible: assetIds.isNotEmpty);
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;

    final count = await ref.read(remoteAlbumServiceProvider).removeAssets(albumId: albumId, assetIds: assetIds);
    ref.read(toastRepositoryProvider).success(context.t.remove_from_album_action_prompt(count: count));
  }
}
