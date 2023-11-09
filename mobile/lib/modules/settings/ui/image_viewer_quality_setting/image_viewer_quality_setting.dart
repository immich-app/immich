import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/settings_switch_list_tile.dart';

class ImageViewerQualitySetting extends HookConsumerWidget {
  const ImageViewerQualitySetting({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsServiceProvider);
    final isPreview = useState(AppSettingsEnum.loadPreview.defaultValue);
    final isOriginal = useState(AppSettingsEnum.loadOriginal.defaultValue);

    useEffect(
      () {
        isPreview.value = settings.getSetting(AppSettingsEnum.loadPreview);
        isOriginal.value = settings.getSetting(AppSettingsEnum.loadOriginal);
        return null;
      },
    );

    return ExpansionTile(
      textColor: context.primaryColor,
      title: const Text(
        'theme_setting_image_viewer_quality_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'theme_setting_image_viewer_quality_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        ListTile(
          title: const Text('setting_image_viewer_help').tr(),
          dense: true,
        ),
        SettingsSwitchListTile(
          appSettingService: settings,
          valueNotifier: isPreview,
          settingsEnum: AppSettingsEnum.loadPreview,
          title: "setting_image_viewer_preview_title".tr(),
          subtitle: "setting_image_viewer_preview_subtitle".tr(),
        ),
        SettingsSwitchListTile(
          appSettingService: settings,
          valueNotifier: isOriginal,
          settingsEnum: AppSettingsEnum.loadOriginal,
          title: "setting_image_viewer_original_title".tr(),
          subtitle: "setting_image_viewer_original_subtitle".tr(),
        ),
      ],
    );
  }
}
