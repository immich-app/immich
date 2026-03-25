import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class FilmstripSetting extends HookConsumerWidget {
  const FilmstripSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filmstripEnabled = useAppSettingsState(AppSettingsEnum.filmstripEnabled);
    final filmstripHeight = useAppSettingsState(AppSettingsEnum.filmstripHeight);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "setting_filmstrip_title".tr()),
        SettingsSwitchListTile(
          valueNotifier: filmstripEnabled,
          title: "setting_filmstrip_enable_title".tr(),
          subtitle: "setting_filmstrip_enable_subtitle".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSliderListTile(
          valueNotifier: filmstripHeight,
          enabled: filmstripEnabled.value,
          text: "setting_filmstrip_height_title".tr(
            namedArgs: {'height': '${filmstripHeight.value}'},
          ),
          label: '${filmstripHeight.value} px',
          minValue: 40,
          maxValue: 120,
          // 8 divisions in steps of 10px: 40, 50, ..., 120px
          noDivisons: 8,
          onChangeEnd: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
