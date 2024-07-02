import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/photo_grid_settings/photo_grid_group_settings.dart';
import 'package:immich_mobile/widgets/settings/photo_grid_settings/photo_grid_visible_albums_setting.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'photo_grid_layout_settings.dart';

class PhotoGridSettings extends HookConsumerWidget {
  const PhotoGridSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showStorageIndicator =
        useAppSettingsState(AppSettingsEnum.storageIndicator);

    final assetListSetting = [
      SettingsSwitchListTile(
        valueNotifier: showStorageIndicator,
        title: 'theme_setting_asset_list_storage_indicator_title'.tr(),
        onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
      ),
      const LayoutSettings(),
      const GroupSettings(),
      const VisibleAlbumsSettings(),
    ];

    return SettingsSubPageScaffold(
      settings: assetListSetting,
      showDivider: true,
    );
  }
}
