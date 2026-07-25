import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

typedef _State = ({bool shouldFavorite, List<String> assetIds});

final _stateProvider = Provider.family.autoDispose<_State?, ActionSource>((ref, source) {
  final AssetsActionState(:ownedAssets) = ref.watch(assetsActionProvider(source));
  if (ownedAssets.isEmpty) {
    return null;
  }

  final shouldFavorite = ownedAssets.favorite(isFavorite: false).isNotEmpty;
  final assetIds = ownedAssets.favorite(isFavorite: !shouldFavorite).map((asset) => asset.id).toList(growable: false);
  return (shouldFavorite: shouldFavorite, assetIds: assetIds);
});

class FavoriteAction extends AssetActionBuilder {
  const FavoriteAction({required super.source});

  @override
  ActionData? build(BuildContext context, WidgetRef ref) {
    final shouldFavorite = ref.watch(_stateProvider(source).select((state) => state?.shouldFavorite));
    if (shouldFavorite == null) {
      return null;
    }

    return .new(
      icon: shouldFavorite ? Icons.favorite_border_rounded : Icons.favorite_rounded,
      label: shouldFavorite ? context.t.favorite : context.t.unfavorite,
      onAction: () => _favorite(context, ref),
    );
  }

  Future<void> _favorite(BuildContext context, WidgetRef ref) async {
    final state = ref.read(_stateProvider(source));
    if (state == null) {
      return;
    }

    final _State(:shouldFavorite, :assetIds) = state;
    final message = shouldFavorite
        ? context.t.favorite_action_prompt(count: assetIds.length)
        : context.t.unfavorite_action_prompt(count: assetIds.length);
    final toast = ref.read(toastRepositoryProvider);
    final selection = ref.read(assetsActionProvider(source).notifier);

    try {
      await ref.read(assetServiceProvider).update(assetIds, isFavorite: .some(shouldFavorite));
      toast.success(message);
      selection.clearSelect();
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to update favorite status for assets");
    }
  }
}
