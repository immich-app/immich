import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/widgets/settings/core/setting_info.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class ForegroundBackupSettings extends HookConsumerWidget {
  const ForegroundBackupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAutoBackup = ref.watch(backupProvider.select((s) => s.autoBackup));
    final isAutoBackupNotifier = useValueNotifier(isAutoBackup);
    useValueChanged(
      isAutoBackup,
      (_, __) => WidgetsBinding.instance.addPostFrameCallback(
        (_) => isAutoBackupNotifier.value = isAutoBackup,
      ),
    );

    final subtitle = isAutoBackup
        ? 'backup_controller_page_status_on'.t(context: context)
        : 'backup_controller_page_status_off'.t(context: context);

    return SettingsCardLayout(
      header: SettingSectionHeader(
        title: 'backup_controller_page_foreground_title'.t(context: context),
        icon: Icons.cloud_upload_outlined,
      ),
      children: [
        const SettingInfo(
          padding: EdgeInsets.only(top: 4),
          text: 'backup_controller_page_desc_backup',
        ),
        SettingSwitchListTile(
          valueNotifier: isAutoBackupNotifier,
          onChanged: (enabled) =>
              ref.read(backupProvider.notifier).setAutoBackup(enabled),
          title: 'backup_controller_page_foreground_title'.t(context: context),
          subtitle: subtitle,
        ),
      ],
    );
  }
}
