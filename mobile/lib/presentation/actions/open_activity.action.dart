import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class OpenActivityAction extends AssetAction<BaseAsset> {
  const OpenActivityAction({required super.assets});

  @override
  IconData get icon => Icons.chat_outlined;

  @override
  String label(ActionScope scope) => scope.context.t.activity;

  static bool canShow({required bool isInLockedView, required RemoteAlbum? album}) =>
      !isInLockedView && album != null && album.isActivityEnabled && album.isShared;

  @override
  bool isVisible(ActionScope scope) => canShow(
    isInLockedView: scope.ref.watch(inLockedViewProvider),
    album: scope.ref.watch(currentRemoteAlbumProvider),
  );

  @override
  Future<void> onAction(ActionScope scope) async {
    final album = scope.ref.read(currentRemoteAlbumProvider);
    final asset = assets.firstOrNull;
    if (album == null || asset == null) {
      return;
    }

    unawaited(
      scope.context.pushRoute(
        DriftActivitiesRoute(album: album, assetId: asset is RemoteAsset ? asset.id : null, assetName: asset.name),
      ),
    );
  }
}
