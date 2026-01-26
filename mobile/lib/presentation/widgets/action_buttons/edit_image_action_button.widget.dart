import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class EditImageActionButton extends ConsumerWidget {
  const EditImageActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentAsset = ref.watch(currentAssetNotifier);

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

      await context.pushRoute(DriftEditImageRoute(asset: currentAsset, image: image, edits: edits, exifInfo: exifInfo));
    }

    return BaseActionButton(
      iconData: Icons.tune,
      label: "edit".t(context: context),
      onPressed: onPress,
    );
  }
}
