import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class EditImageActionButton extends ConsumerWidget {
  const EditImageActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentAsset = ref.watch(currentAssetNotifier);

    Future<void> editImage(List<AssetEdit> edits) async {
      if (currentAsset == null || currentAsset.remoteId == null) {
        return;
      }

      try {
        final completer = ref.read(websocketProvider.notifier).waitForEvent("AssetEditReadyV1", (dynamic data) {
          final eventData = data as Map<String, dynamic>;
          return eventData["asset"]['id'] == currentAsset.remoteId;
        }, const Duration(seconds: 10));

        await ref.read(actionProvider.notifier).applyEdits(ActionSource.viewer, edits);
        await completer;

        ImmichToast.show(context: context, msg: 'asset_edit_success'.tr(), toastType: ToastType.success);

        context.pop();
      } catch (e) {
        ImmichToast.show(context: context, msg: 'asset_edit_failed'.tr(), toastType: ToastType.error);
        return;
      }
    }

    Future<void> onPress() async {
      if (currentAsset == null || currentAsset.remoteId == null) {
        return;
      }

      final imageProvider = getFullImageProvider(currentAsset, edited: false);

      final image = Image(image: imageProvider);
      final edits = await ref.read(remoteAssetRepositoryProvider).getAssetEdits(currentAsset.remoteId!);
      final exifInfo = await ref.read(remoteAssetRepositoryProvider).getExif(currentAsset.remoteId!);

      if (exifInfo == null) {
        return;
      }

      await context.pushRoute(
        DriftEditImageRoute(asset: currentAsset, image: image, edits: edits, exifInfo: exifInfo, applyEdits: editImage),
      );
    }

    return BaseActionButton(
      iconData: Icons.tune,
      label: "edit".t(context: context),
      onPressed: onPress,
    );
  }
}
