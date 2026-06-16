import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class HapticSetting extends HookConsumerWidget {
  const HapticSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isHapticFeedbackEnabled = useState(ref.watch(appConfigProvider).advanced.enableHapticFeedback);
    useValueChanged(
      isHapticFeedbackEnabled.value,
      (_, __) =>
          unawaited(ref.read(settingsProvider).write(.advancedEnableHapticFeedback, isHapticFeedbackEnabled.value)),
    );

    void onHapticFeedbackChange(bool isEnabled) {
      isHapticFeedbackEnabled.value = isEnabled;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(title: context.t.haptic_feedback_title, icon: Icons.vibration_outlined),
        SettingsSwitchListTile(
          valueNotifier: isHapticFeedbackEnabled,
          title: context.t.enabled,
          onChanged: onHapticFeedbackChange,
        ),
      ],
    );
  }
}
