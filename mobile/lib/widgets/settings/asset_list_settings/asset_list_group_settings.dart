import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';

class GroupSettings extends HookConsumerWidget {
  const GroupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupByIndex = useAppSettingsState(AppSettingsEnum.groupAssetsBy);
    final groupBy = GroupAssetsBy.values[groupByIndex.value];

    Future<void> updateAppSettings(GroupAssetsBy groupBy) async {
      await ref.watch(appSettingsServiceProvider).setSetting(AppSettingsEnum.groupAssetsBy, groupBy.index);
      ref.invalidate(appSettingsServiceProvider);
    }

    void changeGroupValue(GroupAssetsBy? value) {
      if (value != null) {
        groupByIndex.value = value.index;
        unawaited(updateAppSettings(groupBy));
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "asset_list_group_by_sub_title".t(context: context),
          icon: Icons.group_work_outlined,
        ),
        SettingsRadioListTile(
          groups: [
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_by_month_day'.t(context: context),
              value: GroupAssetsBy.day,
            ),
            SettingsRadioGroup(
              title: 'month'.t(context: context),
              value: GroupAssetsBy.month,
            ),
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_automatically'.t(context: context),
              value: GroupAssetsBy.auto,
            ),
          ],
          groupBy: groupBy,
          onRadioChanged: changeGroupValue,
        ),
      ],
    );
  }
}
