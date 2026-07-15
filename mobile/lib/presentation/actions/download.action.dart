import 'dart:async';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

class DownloadAction extends BaseAction {
  final List<RemoteAsset> assets;

  DownloadAction._({required this.assets, required super.scope, super.isVisible})
    : super(icon: Icons.download, label: scope.context.t.download);

  factory DownloadAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final remote = AssetFilter(assets).remote().toList(growable: false);
    return ._(assets: remote, scope: scope, isVisible: remote.isNotEmpty);
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:ref) = scope;
    final backgroundSync = ref.read(backgroundSyncProvider);

    await ref.read(downloadRepositoryProvider).downloadAllAssets(assets);

    unawaited(
      Future.delayed(const Duration(seconds: 1), () async {
        await backgroundSync.syncLocal();
        await backgroundSync.hashAssets();
      }),
    );
  }
}
