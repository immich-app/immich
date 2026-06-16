import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class HapticSetting extends HookConsumerWidget {
  const HapticSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isHapticFeedbackEnabled = useState(ref.read(appConfigProvider).advanced.enableHapticFeedback);
    useValueChanged(
      isHapticFeedbackEnabled.value,
      (_, __) => ref.read(settingsProvider).write(.advancedEnableHapticFeedback, isHapticFeedbackEnabled.value),
    );

    onHapticFeedbackChange(bool isEnabled) {
      isHapticFeedbackEnabled.value = isEnabled;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "haptic_feedback_title".t(context: context),
          icon: Icons.vibration_outlined,
        ),
        SettingsSwitchListTile(
          valueNotifier: isHapticFeedbackEnabled,
          title: 'enabled'.t(context: context),
          onChanged: onHapticFeedbackChange,
        ),
      ],
    );
  }
}
