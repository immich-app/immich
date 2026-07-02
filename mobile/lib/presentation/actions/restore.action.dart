import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class RestoreAction extends BaseAction {
  final List<String> assetIds;

  RestoreAction._({required super.scope, required this.assetIds, super.isVisible})
    : super(icon: Icons.history_rounded, label: scope.context.t.restore);

  factory RestoreAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final assetIds = AssetFilter(
      assets,
    ).owned(scope.authUser.id).trashed().map((asset) => asset.id).toList(growable: false);

    return RestoreAction._(assetIds: assetIds, scope: scope, isVisible: assetIds.isNotEmpty);
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    await ref.read(assetServiceProvider).restoreTrash(assetIds);
    ref.read(toastRepositoryProvider).success(context.t.assets_restored_count(count: assetIds.length));
  }
}
