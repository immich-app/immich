import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class ImageViewerQualitySetting extends HookConsumerWidget {
  const ImageViewerQualitySetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPreview = useAppSettingsState(AppSettingsEnum.loadPreview);
    final isOriginal = useAppSettingsState(AppSettingsEnum.loadOriginal);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "photos".t(context: context),
          icon: Icons.image_outlined,
          subtitle: "setting_image_viewer_help".t(context: context),
        ),
        SettingsSwitchListTile(
          valueNotifier: isPreview,
          title: "setting_image_viewer_preview_title".t(context: context),
          subtitle: "setting_image_viewer_preview_subtitle".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSwitchListTile(
          valueNotifier: isOriginal,
          title: "setting_image_viewer_original_title".t(context: context),
          subtitle: "setting_image_viewer_original_subtitle".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
