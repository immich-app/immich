import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class FavoriteAction extends BaseAction {
  final Iterable<BaseAsset> assets;

  const FavoriteAction({required this.assets});

  @override
  AssetActionView<RemoteAsset> resolve(ActionScope scope) {
    final hasNonFavorite = AssetFilter(assets).owned(scope.authUser.id).any((asset) => !asset.isFavorite);
    return hasNonFavorite ? FavoriteView(assets: assets, scope: scope) : UnfavoriteView(assets: assets, scope: scope);
  }
}

@visibleForTesting
class FavoriteView extends AssetActionView<RemoteAsset> {
  const FavoriteView({required super.assets, required super.scope});

  @override
  IconData get icon => Icons.favorite_border_rounded;

  @override
  String get label => scope.context.t.favorite;

  @override
  AssetFilter<RemoteAsset> get filter => .new(assets).owned(scope.authUser.id).favorite(isFavorite: false);

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final ids = filter.map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).updateFavorite(ids, true);
    ref.read(toastRepositoryProvider).success(context.t.favorite_action_prompt(count: ids.length));
  }
}

@visibleForTesting
class UnfavoriteView extends AssetActionView<RemoteAsset> {
  const UnfavoriteView({required super.assets, required super.scope});

  @override
  IconData get icon => Icons.favorite_rounded;

  @override
  String get label => scope.context.t.unfavorite;

  @override
  AssetFilter<RemoteAsset> get filter => .new(assets).owned(scope.authUser.id).favorite();

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final ids = filter.map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).updateFavorite(ids, false);
    ref.read(toastRepositoryProvider).success(context.t.unfavorite_action_prompt(count: ids.length));
  }
}
