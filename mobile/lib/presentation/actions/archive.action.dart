import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class ArchiveAction extends AssetAction<RemoteAsset> {
  final bool archive;

  ArchiveAction({required super.assets})
    : archive = assets.any((asset) => asset is RemoteAsset && asset.visibility != .archive);

  @override
  IconData get icon => archive ? Icons.archive_outlined : Icons.unarchive_outlined;

  @override
  String label(ActionScope scope) => archive ? scope.context.t.archive : scope.context.t.unarchive;

  @override
  Iterable<RemoteAsset> filter(ActionScope scope) {
    final owned = AssetFilter(assets).owned(scope.authUser.id);
    if (archive) {
      return owned.visibility(.timeline);
    } else {
      return owned.visibility(.archive);
    }
  }

  @override
  bool isVisible(ActionScope scope) => !scope.ref.watch(inLockedViewProvider) && filter(scope).isNotEmpty;

  @override
  Future<void> onAction(ActionScope scope) async {
    final ActionScope(:ref, :context) = scope;
    final assets = filter(scope).map((asset) => asset.id).toList(growable: false);

    await ref.read(assetServiceProvider).updateVisibility(assets, archive ? .archive : .timeline);
    final message = archive
        ? context.t.archive_action_prompt(count: assets.length)
        : context.t.unarchive_action_prompt(count: assets.length);
    ref.read(toastRepositoryProvider).success(message);
  }
}
