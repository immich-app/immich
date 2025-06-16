import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';

class LayoutSettings extends HookConsumerWidget {
  const LayoutSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final useDynamicLayout = useAppSettingsState(AppSettingsEnum.dynamicLayout);
    final tilesPerRow = useAppSettingsState(AppSettingsEnum.tilesPerRow);

    return SettingsCardLayout(
      header: SettingSectionHeader(
        icon: Icons.dashboard_outlined,
        title: "asset_list_layout_sub_title".tr(),
      ),
      children: [
        SettingSwitchListTile(
          valueNotifier: useDynamicLayout,
          title: "asset_list_layout_settings_dynamic_layout_title".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingSliderListTile(
          valueNotifier: tilesPerRow,
          title: 'theme_setting_asset_list_tiles_per_row_title'
              .tr(namedArgs: {'count': "${tilesPerRow.value}"}),
          label: "${tilesPerRow.value}",
          max: 6,
          min: 2,
          divisions: 4,
          onChangeEnd: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
