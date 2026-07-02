import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class RestoreAction extends AssetAction<RemoteAsset> {
  const RestoreAction({required super.assets});

  @override
  RestoreActionView resolve(ActionScope scope) => .new(assets: assets, scope: scope);
}

@visibleForTesting
class RestoreActionView extends AssetActionView<RemoteAsset> {
  const RestoreActionView({required super.assets, required super.scope});

  @override
  IconData get icon => Icons.history_rounded;

  @override
  String get label => scope.context.t.restore;

  @override
  AssetFilter<RemoteAsset> get filter => .new(assets).owned(scope.authUser.id).trashed();

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final ids = filter.map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).restoreTrash(ids);
    ref.read(toastRepositoryProvider).success(context.t.assets_restored_count(count: ids.length));
  }
}
