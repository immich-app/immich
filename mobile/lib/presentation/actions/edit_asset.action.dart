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
  final Iterable<RemoteAsset> assets;

  EditAssetAction._({required this.assets, required super.scope, super.isVisible})
    : super(icon: Icons.tune, label: scope.context.t.edit);

  factory EditAssetAction({required Iterable<BaseAsset> assets, required ActionScope scope}) {
    final editable = AssetFilter(
      assets,
    ).owned(scope.authUser.id).where((asset) => asset.isEditable).toList(growable: false);
    final isSupported = scope.ref.watch(serverInfoProvider).serverVersion >= const SemVer(major: 2, minor: 6, patch: 0);

    return EditAssetAction._(assets: editable, scope: scope, isVisible: isSupported && editable.length == 1);
  }

  @override
  Future<void> onAction() async {
    final ActionScope(:context, :ref) = scope;

    // TODO(shenlong): Move all EXIF and Apply Edits logic onto the Route
    final asset = assets.first;
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
