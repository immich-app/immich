import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/widgets/settings/asset_list_settings/asset_list_group_settings.dart';
import 'package:immich_mobile/widgets/settings/asset_list_settings/storage_indicator_setting.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_sub_page_scaffold.dart';
import 'asset_list_layout_settings.dart';

class AssetListSettings extends HookConsumerWidget {
  const AssetListSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetListSetting = [
      const StorageIndicatorSetting(),
      const LayoutSettings(),
      const GroupSettings(),
    ];

    return SettingsSubPageScaffold(
      settings: assetListSetting,
    );
  }
}
