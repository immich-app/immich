import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class FavoriteAction extends BaseAction {
  final List<String> assetIds;
  final bool favorite;

  const FavoriteAction._({
    required this.assetIds,
    required this.favorite,
    required super.scope,
    required super.icon,
    required super.label,
    super.isVisible,
  });

  factory FavoriteAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final ownedAssets = AssetFilter(assets).owned(scope.authUser.id);
    final favorite = ownedAssets.favorite(isFavorite: false).isNotEmpty;
    final assetIds = ownedAssets.favorite(isFavorite: !favorite).map((asset) => asset.id).toList(growable: false);

    return FavoriteAction._(
      assetIds: assetIds,
      favorite: favorite,
      scope: scope,
      icon: favorite ? Icons.favorite_border_rounded : Icons.favorite_rounded,
      label: favorite ? scope.context.t.favorite : scope.context.t.unfavorite,
      isVisible: assetIds.isNotEmpty,
    );
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;

    await ref.read(assetServiceProvider).update(assetIds, isFavorite: .some(favorite));
    final message = favorite
        ? context.t.favorite_action_prompt(count: assetIds.length)
        : context.t.unfavorite_action_prompt(count: assetIds.length);
    ref.read(toastRepositoryProvider).success(message);
  }
}
