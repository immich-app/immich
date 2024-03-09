import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup_verification.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/backup_settings/background_settings.dart';
import 'package:immich_mobile/modules/settings/ui/backup_settings/foreground_settings.dart';
import 'package:immich_mobile/modules/settings/ui/settings_button_list_tile.dart';
import 'package:immich_mobile/modules/settings/ui/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/modules/settings/ui/settings_switch_list_tile.dart';
import 'package:immich_mobile/modules/settings/utils/app_settings_update_hook.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class BackupSettings extends HookConsumerWidget {
  const BackupSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ignoreIcloudAssets =
        useAppSettingsState(AppSettingsEnum.ignoreIcloudAssets);
    final isAdvancedTroubleshooting =
        useAppSettingsState(AppSettingsEnum.advancedTroubleshooting);
    final iosWakeLock =
        useAppSettingsState(AppSettingsEnum.iosKeepAliveOnBackup);
    final isCorruptCheckInProgress = ref.watch(backupVerificationProvider);

    void enableWakeLock(bool isEnabled) {
      final backupProgress = ref.read(
        backupProvider.select((s) => s.backupProgress),
      );
      WakelockPlus.toggle(
        enable:
            Platform.isIOS && isEnabled && backupProgress.foregreoundInProgress,
      );
    }

    final backupSettings = [
      const ForegroundBackupSettings(),
      const BackgroundBackupSettings(),
      if (Platform.isIOS)
        SettingsSwitchListTile(
          valueNotifier: ignoreIcloudAssets,
          title: 'Ignore iCloud photos',
          subtitle:
              'Photos that are stored on iCloud will not be uploaded to the Immich server',
        ),
      if (Platform.isIOS)
        SettingsSwitchListTile(
          valueNotifier: iosWakeLock,
          onChanged: enableWakeLock,
          title: 'Disable screen auto lock',
          subtitle:
              'Prevent the screen from turning off when foreground backup is in-progress',
        ),
      if (Platform.isAndroid && isAdvancedTroubleshooting.value)
        SettingsButtonListTile(
          icon: Icons.warning_rounded,
          title: 'Check for corrupt asset backups',
          subtitle: isCorruptCheckInProgress
              ? const Column(
                  children: [
                    SizedBox(height: 20),
                    Center(child: ImmichLoadingIndicator()),
                    SizedBox(height: 20),
                  ],
                )
              : null,
          subtileText: !isCorruptCheckInProgress
              ? 'Run this check only over Wi-Fi and once all assets have been backed-up. The procedure might take a few minutes.'
              : null,
          buttonText: 'Perform check',
          onButtonTap: !isCorruptCheckInProgress
              ? () => ref
                  .read(backupVerificationProvider.notifier)
                  .performBackupCheck(context)
              : null,
        ),
    ];

    return SettingsSubPageScaffold(
      settings: backupSettings,
      showDivider: true,
    );
  }
}
