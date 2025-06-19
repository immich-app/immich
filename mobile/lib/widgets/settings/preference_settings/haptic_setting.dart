import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class HapticSetting extends HookConsumerWidget {
  const HapticSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isHapticFeedback =
        useAppSettingsState(AppSettingsEnum.enableHapticFeedback);

    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        SettingSwitchListTile(
          valueNotifier: isHapticFeedback,
          title: 'haptic_feedback_switch'.tr(),
        ),
      ],
    );
  }
}
