import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class ArchiveAction extends AssetAction<RemoteAsset> {
  const ArchiveAction({required super.assets});

  @override
  AssetActionView<RemoteAsset> resolve(ActionScope scope) {
    final hasNonArchived = AssetFilter(assets).owned(scope.authUser.id).any((asset) => asset.visibility != .archive);
    return hasNonArchived ? ArchiveView(assets: assets, scope: scope) : UnarchiveView(assets: assets, scope: scope);
  }
}

@visibleForTesting
class ArchiveView extends AssetActionView<RemoteAsset> {
  const ArchiveView({required super.assets, required super.scope});

  @override
  IconData get icon => Icons.archive_outlined;

  @override
  String get label => scope.context.t.archive;

  @override
  AssetFilter<RemoteAsset> get filter => .new(assets).owned(scope.authUser.id).archived(isArchived: false);

  @override
  bool get isVisible => !scope.ref.watch(inLockedViewProvider) && filter.isNotEmpty;

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final ids = filter.map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).updateVisibility(ids, .archive);
    ref.read(toastRepositoryProvider).success(context.t.archive_action_prompt(count: ids.length));
  }
}

@visibleForTesting
class UnarchiveView extends AssetActionView<RemoteAsset> {
  const UnarchiveView({required super.assets, required super.scope});

  @override
  IconData get icon => Icons.unarchive_outlined;

  @override
  String get label => scope.context.t.unarchive;

  @override
  AssetFilter<RemoteAsset> get filter => .new(assets).owned(scope.authUser.id).archived();

  @override
  bool get isVisible => !scope.ref.watch(inLockedViewProvider) && filter.isNotEmpty;

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;
    final ids = filter.map((asset) => asset.id).toList(growable: false);
    await ref.read(assetServiceProvider).updateVisibility(ids, .timeline);
    ref.read(toastRepositoryProvider).success(context.t.unarchive_action_prompt(count: ids.length));
  }
}
