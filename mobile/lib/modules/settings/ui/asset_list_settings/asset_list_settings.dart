import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/asset_list_settings/asset_list_group_settings.dart';
import 'package:immich_mobile/modules/settings/ui/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/modules/settings/ui/settings_switch_list_tile.dart';
import 'package:immich_mobile/modules/settings/utils/app_settings_update_hook.dart';
import 'asset_list_layout_settings.dart';

class AssetListSettings extends HookWidget {
  const AssetListSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final showStorageIndicator =
        useAppSettingsState(AppSettingsEnum.storageIndicator);

    final assetListSetting = [
      SettingsSwitchListTile(
        valueNotifier: showStorageIndicator,
        title: 'theme_setting_asset_list_storage_indicator_title'.tr(),
      ),
      const LayoutSettings(),
      const GroupSettings(),
    ];

    return SettingsSubPageScaffold(
      settings: assetListSetting,
      showDivider: true,
    );
  }
}
