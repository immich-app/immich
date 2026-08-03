import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/utils/error_handler.dart';

final _stateProvider = Provider.family.autoDispose<List<RemoteAsset>?, ActionSource>((ref, source) {
  final assets = ref.watch(assetsActionProvider(source));
  final remote = assets.remote().toList(growable: false);
  return remote.isEmpty ? null : remote;
});

class DownloadAction extends AssetActionBuilder {
  const DownloadAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    final assets = ref.watch(_stateProvider(source));
    if (assets == null) {
      return null;
    }

    return .new(icon: Icons.download, label: context.t.download, onAction: () => _download(ref, assets));
  }

  Future<void> _download(WidgetRef ref, List<RemoteAsset> assets) async {
    final backgroundSync = ref.read(backgroundSyncProvider);
    final downloads = ref.read(downloadRepositoryProvider);

    try {
      await downloads.downloadAllAssets(assets);

      unawaited(
        Future.delayed(const .new(seconds: 1), () async {
          await backgroundSync.syncLocal();
          await backgroundSync.hashAssets();
        }),
      );
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to download the assets");
    }
  }
}
