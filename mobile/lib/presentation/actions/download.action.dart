import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class DownloadAction extends BaseAction {
  const DownloadAction();

  @override
  IconData icon(_) => Icons.download;

  @override
  String label(context) => context.t.download;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(Iterable<BaseAsset> assets) => AssetFilter(assets).remote();

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assetsForAction(assets).isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final backgroundSync = ref.read(backgroundSyncProvider);
    await ref.read(downloadRepositoryProvider).downloadAllAssets(assetsForAction(assets).toList(growable: false));

    unawaited(
      Future.delayed(const Duration(seconds: 1), () async {
        await backgroundSync.syncLocal();
        await backgroundSync.hashAssets();
      }),
    );
  }
}
