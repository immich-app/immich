import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class FavoriteAction extends AssetAction<RemoteAsset> {
  final bool favorite;

  FavoriteAction({required super.assets}) : favorite = assets.any((asset) => !asset.isFavorite);

  @override
  IconData get icon => favorite ? Icons.favorite_border_rounded : Icons.favorite_rounded;

  @override
  String label(ActionScope scope) => favorite ? scope.context.t.favorite : scope.context.t.unfavorite;

  @override
  Iterable<RemoteAsset> filter(ActionScope scope) =>
      AssetFilter(assets).owned(scope.authUser.id).favorite(isFavorite: !favorite);

  @override
  bool isVisible(ActionScope scope) => filter(scope).isNotEmpty;

  @override
  Future<void> onAction(ActionScope scope) async {
    final ActionScope(:ref, :context) = scope;
    final assets = filter(scope).map((asset) => asset.id).toList(growable: false);

    await ref.read(assetServiceProvider).updateFavorite(assets, favorite);
    final message = favorite
        ? context.t.favorite_action_prompt(count: assets.length)
        : context.t.unfavorite_action_prompt(count: assets.length);
    ref.read(toastRepositoryProvider).success(message);
  }
}
