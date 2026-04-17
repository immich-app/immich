import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';

class LayoutSettings extends HookConsumerWidget {
  const LayoutSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tilesPerRow = useAppSettingsState(AppSettingsEnum.tilesPerRow);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "asset_list_layout_sub_title".t(context: context),
          icon: Icons.view_module_outlined,
        ),
        SettingsSliderListTile(
          valueNotifier: tilesPerRow,
          text: 'theme_setting_asset_list_tiles_per_row_title'.tr(namedArgs: {'count': "${tilesPerRow.value}"}),
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
