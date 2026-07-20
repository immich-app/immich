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
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:immich_mobile/utils/semver.dart';

class EditAssetAction extends BaseAction {
  const EditAssetAction();

  @override
  IconData get icon => Icons.tune;

  @override
  String label(context) => context.t.edit;

  @visibleForTesting
  Iterable<RemoteAsset> assetsForAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      AssetFilter(assets).owned(currentUser(ref).id).where((asset) => asset.isEditable);

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) {
    final supported = ref.watch(serverInfoProvider).serverVersion >= const SemVer(major: 2, minor: 6, patch: 0);
    return supported && assetsForAction(ref, assets).singleOrNull != null;
  }

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;
    final asset = assetsForAction(ref, assets).single;

    // TODO(shenlong): Move all EXIF and Apply Edits logic onto the Route
    final repository = ref.read(remoteAssetRepositoryProvider);
    final (edits, exif) = await (repository.getAssetEdits(asset.id), repository.getExif(asset.id)).wait;
    if (exif == null || !context.mounted) {
      return;
    }

    ref.read(editorStateProvider.notifier).init(edits, exif);
    unawaited(
      context.pushRoute(
        DriftEditImageRoute(
          image: Image(image: getFullImageProvider(asset, edited: false)),
          applyEdits: (newEdits) => applyEdits(ref, asset.id, newEdits),
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
