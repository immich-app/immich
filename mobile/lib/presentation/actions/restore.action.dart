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
  IconData get icon => Icons.history_rounded;

  @override
  String label(ActionScope scope) => scope.context.t.restore;

  @override
  Iterable<RemoteAsset> filter(ActionScope scope) => AssetFilter(assets).owned(scope.authUser.id).trashed();

  @override
  bool isVisible(ActionScope scope) => filter(scope).isNotEmpty;

  @override
  Future<void> onAction(ActionScope scope) async {
    final ActionScope(:ref, :context) = scope;
    final ids = filter(scope).map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).restoreTrash(ids);
    ref.read(toastRepositoryProvider).success(context.t.assets_restored_count(count: ids.length));
  }
}
