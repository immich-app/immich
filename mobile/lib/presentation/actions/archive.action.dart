import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class ArchiveAction extends BaseAction {
  final List<String> assetIds;
  final bool archive;

  const ArchiveAction._({
    required this.assetIds,
    required this.archive,
    required super.scope,
    required super.icon,
    required super.label,
    super.isVisible,
  });

  factory ArchiveAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final ownedAssets = AssetFilter(assets).owned(scope.authUser.id);
    final archive = ownedAssets.archived(isArchived: false).isNotEmpty;
    final assetIds = ownedAssets.archived(isArchived: !archive).map((asset) => asset.id).toList(growable: false);

    return ArchiveAction._(
      assetIds: assetIds,
      archive: archive,
      scope: scope,
      icon: archive ? Icons.archive_outlined : Icons.unarchive_outlined,
      label: archive ? scope.context.t.archive : scope.context.t.unarchive,
      isVisible: assetIds.isNotEmpty,
    );
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref, :context) = scope;

    await ref.read(assetServiceProvider).update(assetIds, visibility: .some(archive ? .archive : .timeline));
    final message = archive
        ? context.t.archive_action_prompt(count: assetIds.length)
        : context.t.unarchive_action_prompt(count: assetIds.length);
    ref.read(toastRepositoryProvider).success(message);
  }
}
