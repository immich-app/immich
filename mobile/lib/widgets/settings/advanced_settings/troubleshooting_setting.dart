import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';

class TroubleshootingSetting extends HookConsumerWidget {
  const TroubleshootingSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final advancedTroubleshooting =
        useAppSettingsState(AppSettingsEnum.advancedTroubleshooting);

    return SettingSwitchListTile(
      valueNotifier: advancedTroubleshooting,
      title: 'advanced_settings_troubleshooting_title'.t(context: context),
      subtitle:
          'advanced_settings_troubleshooting_subtitle'.t(context: context),
    );
  }
}
