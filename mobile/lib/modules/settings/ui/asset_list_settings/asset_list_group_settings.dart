import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/settings_radio_list_tile.dart';
import 'package:immich_mobile/modules/settings/ui/settings_sub_title.dart';
import 'package:immich_mobile/modules/settings/utils/app_settings_update_hook.dart';

class GroupSettings extends HookWidget {
  const GroupSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final groupByIndex = useAppSettingsState(AppSettingsEnum.groupAssetsBy);
    final groupBy = GroupAssetsBy.values[groupByIndex.value];

    void changeGroupValue(GroupAssetsBy? value) {
      if (value != null) {
        groupByIndex.value = value.index;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "asset_list_group_by_sub_title".tr()),
        SettingsRadioListTile(
          groups: [
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_by_month_day'.tr(),
              value: GroupAssetsBy.day,
            ),
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_by_month'.tr(),
              value: GroupAssetsBy.month,
            ),
            SettingsRadioGroup(
              title: 'asset_list_layout_settings_group_automatically'.tr(),
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
