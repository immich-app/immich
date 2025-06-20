import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class IgnoreIcloudAssetsSetting extends HookConsumerWidget {
  const IgnoreIcloudAssetsSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ignoreIcloudAssets =
        useAppSettingsState(AppSettingsEnum.ignoreIcloudAssets);
    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        SettingSwitchListTile(
          valueNotifier: ignoreIcloudAssets,
          title: 'ignore_icloud_photos'.t(context: context),
          subtitle: 'ignore_icloud_photos_description'.t(context: context),
        ),
      ],
    );
  }
}
