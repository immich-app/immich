import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/services/dynamic_wallpaper.service.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class DynamicWallpaperActionButton extends ConsumerWidget {
  const DynamicWallpaperActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.wallpaper_outlined,
      label: 'dynamic_wallpaper_action'.tr(),
      onPressed: () async {
        final assets = ref.read(multiSelectProvider).selectedAssets;
        final service = ref.read(dynamicWallpaperServiceProvider);
        final assetIds = service.remoteImageIdsFromAssets(assets);

        if (assetIds.isEmpty) {
          ImmichToast.show(
            context: context,
            msg: 'dynamic_wallpaper_no_supported_assets'.tr(),
            toastType: ToastType.error,
          );
          return;
        }

        final DynamicWallpaperSelectionUpdate update;
        try {
          update = await service.addSelection(assets);
        } catch (_) {
          if (context.mounted) {
            ImmichToast.show(context: context, msg: 'dynamic_wallpaper_update_failed'.tr(), toastType: ToastType.error);
          }
          return;
        }

        if (!context.mounted) {
          return;
        }

        final messageKey = switch ((update.addedCount > 0, update.skippedCount > 0)) {
          (true, true) => 'dynamic_wallpaper_selection_added_and_skipped',
          (true, false) => 'dynamic_wallpaper_selection_added_only',
          _ => 'dynamic_wallpaper_selection_skipped_only',
        };

        ImmichToast.show(
          context: context,
          msg: messageKey.tr(
            namedArgs: {'added': update.addedCount.toString(), 'skipped': update.skippedCount.toString()},
          ),
        );
      },
      maxWidth: 100,
    );
  }
}
