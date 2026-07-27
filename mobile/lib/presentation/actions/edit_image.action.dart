import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/pages/edit/editor.provider.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/semver.dart';

class EditImageAction extends AssetAction<BaseAsset> {
  const EditImageAction({required super.assets});

  @override
  IconData get icon => Icons.tune;

  @override
  String label(ActionScope scope) => scope.context.t.edit;

  static bool canShow({required BaseAsset asset, required bool isInLockedView, required SemVer serverVersion}) =>
      !isInLockedView &&
      asset.isEditable &&
      // edit sync was added in 2.6.0
      serverVersion >= const SemVer(major: 2, minor: 6, patch: 0);

  @override
  bool isVisible(ActionScope scope) =>
      assets.length == 1 &&
      canShow(
        asset: assets.first,
        isInLockedView: scope.ref.watch(inLockedViewProvider),
        serverVersion: scope.ref.watch(serverInfoProvider.select((state) => state.serverVersion)),
      );

  @override
  Future<void> onAction(ActionScope scope) async {
    final ActionScope(:context, :ref) = scope;
    final asset = assets.firstOrNull;
    if (asset == null || asset.remoteId == null) {
      return;
    }

    final imageProvider = getFullImageProvider(asset, edited: false);
    final image = Image(image: imageProvider);
    final (edits, exifInfo) = await (
      ref.read(remoteAssetRepositoryProvider).getAssetEdits(asset.remoteId!),
      ref.read(remoteAssetRepositoryProvider).getExif(asset.remoteId!),
    ).wait;

    if (exifInfo == null) {
      return;
    }

    ref.read(editorStateProvider.notifier).init(edits, exifInfo);
    await context.pushRoute(
      DriftEditImageRoute(
        image: image,
        applyEdits: (edits) => ref.read(actionProvider.notifier).applyEdits(ActionSource.viewer, edits),
      ),
    );
  }
}
