import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class LockAction extends BaseAction {
  final List<String> assetIds;
  final bool lock;

  const LockAction._({
    required this.assetIds,
    required this.lock,
    required super.scope,
    required super.icon,
    required super.label,
    super.isVisible,
  });

  factory LockAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final ownedAssets = AssetFilter(assets).owned(scope.authUser.id);
    final lock = ownedAssets.locked(isLocked: false).isNotEmpty;
    final assetIds = ownedAssets.locked(isLocked: !lock).map((asset) => asset.id).toList(growable: false);

    return LockAction._(
      assetIds: assetIds,
      lock: lock,
      scope: scope,
      icon: lock ? Icons.lock_rounded : Icons.lock_open_rounded,
      label: lock ? scope.context.t.move_to_locked_folder : scope.context.t.remove_from_locked_folder,
      isVisible: assetIds.isNotEmpty,
    );
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;

    await ref.read(assetServiceProvider).update(assetIds, visibility: .some(lock ? .locked : .timeline));
    final message = lock
        ? scope.context.t.move_to_lock_folder_action_prompt(count: assetIds.length)
        : scope.context.t.remove_from_lock_folder_action_prompt(count: assetIds.length);
    ref.read(toastRepositoryProvider).success(message);
  }
}
