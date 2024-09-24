import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class TimelineSetting extends HookConsumerWidget {
  const TimelineSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showPartnerInTimelineSetting =
        useAppSettingsState(AppSettingsEnum.showPartnerIconInTimeline);

    final showStorageIndicatorSetting =
        useAppSettingsState(AppSettingsEnum.storageIndicator);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "timeline_settings_title".tr()),
        SettingsSwitchListTile(
          valueNotifier: showStorageIndicatorSetting,
          title: 'theme_setting_asset_list_storage_indicator_title'.tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSwitchListTile(
          valueNotifier: showPartnerInTimelineSetting,
          title: 'timeline_show_partner_switch'.tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
