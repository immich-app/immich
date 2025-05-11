import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class LayoutSettings extends HookConsumerWidget {
  const LayoutSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final useDynamicLayout = useAppSettingsState(AppSettingsEnum.dynamicLayout);
    final tilesPerRow = useAppSettingsState(AppSettingsEnum.tilesPerRow);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "asset_list_layout_sub_title".tr()),
        SettingsSwitchListTile(
          valueNotifier: useDynamicLayout,
          title: "asset_list_layout_settings_dynamic_layout_title".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSliderListTile(
          valueNotifier: tilesPerRow,
          text: 'theme_setting_asset_list_tiles_per_row_title'
              .tr(args: ["${tilesPerRow.value}"]),
          label: "${tilesPerRow.value}",
          maxValue: 6,
          minValue: 2,
          noDivisons: 4,
          onChangeEnd: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
