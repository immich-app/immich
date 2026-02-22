import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class ImageViewerTapToNavigateSetting extends HookConsumerWidget {
  const ImageViewerTapToNavigateSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tapToNavigate = useAppSettingsState(AppSettingsEnum.tapToNavigate);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "setting_image_navigation_title".tr()),
        SettingsSwitchListTile(
          valueNotifier: tapToNavigate,
          title: "setting_image_navigation_enable_title".tr(),
          subtitle: "setting_image_navigation_enable_subtitle".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
