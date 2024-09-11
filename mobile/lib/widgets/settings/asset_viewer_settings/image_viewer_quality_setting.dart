import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class ImageViewerQualitySetting extends HookConsumerWidget {
  const ImageViewerQualitySetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPreview = useAppSettingsState(AppSettingsEnum.loadPreview);
    final isOriginal = useAppSettingsState(AppSettingsEnum.loadOriginal);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "setting_image_viewer_title".tr()),
        ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
          title: Text(
            'setting_image_viewer_help',
            style: context.textTheme.bodyMedium,
          ).tr(),
        ),
        SettingsSwitchListTile(
          valueNotifier: isPreview,
          title: "setting_image_viewer_preview_title".tr(),
          subtitle: "setting_image_viewer_preview_subtitle".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSwitchListTile(
          valueNotifier: isOriginal,
          title: "setting_image_viewer_original_title".tr(),
          subtitle: "setting_image_viewer_original_subtitle".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
