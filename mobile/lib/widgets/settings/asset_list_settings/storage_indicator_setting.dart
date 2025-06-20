import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class StorageIndicatorSetting extends HookConsumerWidget {
  const StorageIndicatorSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showStorageIndicator =
        useAppSettingsState(AppSettingsEnum.storageIndicator);

    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        SettingSwitchListTile(
          valueNotifier: showStorageIndicator,
          title: 'theme_setting_asset_list_storage_indicator_title'
              .t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
