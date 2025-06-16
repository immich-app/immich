import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/widgets/common/responsive_button.dart';
import 'package:immich_mobile/widgets/settings/core/setting_info.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';

import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class ForegroundBackupSettings extends ConsumerWidget {
  const ForegroundBackupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isEnabled = ref.watch(backupProvider.select((s) => s.autoBackup));
    void toggleForegroundBackup() =>
        ref.read(backupProvider.notifier).setAutoBackup(!isEnabled);

    final subtitleHeader = isEnabled
        ? 'backup_controller_page_foreground_on_subtitle'.tr()
        : 'backup_controller_page_foreground_off_subtitle'.tr();
    final indicatorState =
        isEnabled ? IndicatorState.enabled : IndicatorState.disabled;
    final buttonText = isEnabled
        ? 'backup_controller_page_turn_off'.tr()
        : 'backup_controller_page_turn_on'.tr();

    return SettingsCardLayout(
      contentSpacing: 8,
      header: SettingIndicatorSectionHeader(
        padding: const EdgeInsets.only(top: 12, left: 16, right: 16),
        title: 'backup_controller_page_foreground_title'.tr(),
        subtitle: subtitleHeader,
        indicatorState: indicatorState,
      ),
      children: [
        if (!isEnabled)
          const SettingInfo(text: 'backup_controller_page_desc_backup'),
        Center(
          child: ResponsiveButton(
            onPressed: toggleForegroundBackup,
            child: Text(
              buttonText,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(height: 4),
      ],
    );
  }
}
