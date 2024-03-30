import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/modules/settings/ui/settings_switch_list_tile.dart';
import 'package:immich_mobile/modules/settings/utils/app_settings_update_hook.dart';

class ImageViewerQualitySetting extends HookWidget {
  const ImageViewerQualitySetting({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final isPreview = useAppSettingsState(AppSettingsEnum.loadPreview);
    final isOriginal = useAppSettingsState(AppSettingsEnum.loadOriginal);
    final autoPlayVideos = useAppSettingsState(AppSettingsEnum.autoPlayVideos);

    final viewerSettings = [
      ListTile(
        title: Text(
          'setting_image_viewer_help',
          style: context.textTheme.bodyMedium,
        ).tr(),
      ),
      SettingsSwitchListTile(
        valueNotifier: isPreview,
        title: "setting_image_viewer_preview_title".tr(),
        subtitle: "setting_image_viewer_preview_subtitle".tr(),
      ),
      SettingsSwitchListTile(
        valueNotifier: isOriginal,
        title: "setting_image_viewer_original_title".tr(),
        subtitle: "setting_image_viewer_original_subtitle".tr(),
      ),
      SettingsSwitchListTile(
        valueNotifier: autoPlayVideos,
        title: "setting_image_viewer_auto_play_videos_title".tr(),
        subtitle: "setting_image_viewer_auto_play_videos_subtitle".tr(),
      ),
    ];

    return SettingsSubPageScaffold(settings: viewerSettings);
  }
}
