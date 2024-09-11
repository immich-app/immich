import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';

class ForegroundBackupSettings extends ConsumerWidget {
  const ForegroundBackupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAutoBackup = ref.watch(backupProvider.select((s) => s.autoBackup));

    void onButtonTap() =>
        ref.read(backupProvider.notifier).setAutoBackup(!isAutoBackup);

    if (isAutoBackup) {
      return SettingsButtonListTile(
        icon: Icons.cloud_done_rounded,
        iconColor: context.primaryColor,
        title: 'backup_controller_page_status_on'.tr(),
        buttonText: 'backup_controller_page_turn_off'.tr(),
        onButtonTap: onButtonTap,
      );
    }

    return SettingsButtonListTile(
      icon: Icons.cloud_off_rounded,
      title: 'backup_controller_page_status_off'.tr(),
      subtileText: 'backup_controller_page_desc_backup'.tr(),
      buttonText: 'backup_controller_page_turn_on'.tr(),
      onButtonTap: onButtonTap,
    );
  }
}
