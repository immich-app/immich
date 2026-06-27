import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/pages/edit/editor.provider.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/semver.dart';

class EditAssetAction extends AssetAction<RemoteAsset> {
  const EditAssetAction({required super.assets});

  @override
  IconData get icon => Icons.tune;

  @override
  String label(ActionScope scope) => scope.context.t.edit;

  @override
  Iterable<RemoteAsset> filter(ActionScope scope) =>
      assets.whereType<RemoteAsset>().where((asset) => asset.ownerId == scope.authUser.id && asset.isEditable);

  @override
  bool isVisible(ActionScope scope) =>
      filter(scope).length == 1 &&
      scope.ref.watch(serverInfoProvider).serverVersion >= const SemVer(major: 2, minor: 6, patch: 0);

  @override
  Future<void> onAction(ActionScope scope) async {
    final ActionScope(:context, :ref) = scope;

    final asset = filter(scope).first;
    final remoteId = asset.id;
    final repository = ref.read(remoteAssetRepositoryProvider);
    final (edits, exif) = await (repository.getAssetEdits(remoteId), repository.getExif(remoteId)).wait;
    if (exif == null || !context.mounted) {
      return;
    }

    ref.read(editorStateProvider.notifier).init(edits, exif);
    unawaited(
      context.pushRoute(
        DriftEditImageRoute(
          image: Image(image: getFullImageProvider(asset, edited: false)),
          applyEdits: (newEdits) => applyEdits(ref, remoteId, newEdits),
        ),
      ),
    );
  }
}

@visibleForTesting
Future<void> applyEdits(WidgetRef ref, String remoteId, List<AssetEdit> edits) async {
  final websocket = ref.read(websocketProvider.notifier);

  bool isCurrentId(dynamic data) => data is Map && (data['asset'] as Map?)?['id'] == remoteId;
  await ref.read(assetServiceProvider).applyEdits(remoteId, edits);
  await Future.any([
    websocket.waitForEvent('AssetEditReadyV1', isCurrentId, const Duration(seconds: 10)),
    websocket.waitForEvent('AssetEditReadyV2', isCurrentId, const Duration(seconds: 10)),
  ]).catchError((_) {});
}
