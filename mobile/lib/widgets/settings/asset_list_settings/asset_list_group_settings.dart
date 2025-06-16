import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
import 'package:immich_mobile/widgets/settings/core/setting_radio_list_tile.dart';

class GroupSettings extends HookConsumerWidget {
  const GroupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final groupByIndex = useAppSettingsState(AppSettingsEnum.groupAssetsBy);
    final currentGroupBy = GroupAssetsBy.values[groupByIndex.value];

    Future<void> updateGroupBySetting(GroupAssetsBy newGroupBy) async {
      try {
        await ref.read(appSettingsServiceProvider).setSetting(
              AppSettingsEnum.groupAssetsBy,
              newGroupBy.index,
            );
        ref.invalidate(appSettingsServiceProvider);
      } catch (e) {
        debugPrint('Failed to update group by setting: $e');
      }
    }

    void handleGroupByChange(GroupAssetsBy? selectedGroupBy) {
      if (selectedGroupBy == null || selectedGroupBy == currentGroupBy) {
        return;
      }
      groupByIndex.value = selectedGroupBy.index;
      unawaited(updateGroupBySetting(selectedGroupBy));
    }

    return SettingsCardLayout(
      header: SettingSectionHeader(
        title: "asset_list_group_by_sub_title".tr(),
        icon: Icons.category_outlined,
      ),
      children: [
        SettingRadioListTile<GroupAssetsBy>(
          contentPadding: EdgeInsets.zero,
          groups: [
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_by_month_day'.tr(),
              value: GroupAssetsBy.day,
            ),
            SettingsRadioGroup(
              title: 'month'.tr(),
              value: GroupAssetsBy.month,
            ),
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_automatically'.tr(),
              value: GroupAssetsBy.auto,
            ),
          ],
          groupBy: currentGroupBy,
          onRadioChanged: handleGroupByChange,
        ),
      ],
    );
  }
}
