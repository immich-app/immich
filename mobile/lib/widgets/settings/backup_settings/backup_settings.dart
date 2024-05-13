import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/backup_verification.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/background_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/foreground_settings.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';

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
    final isCorruptCheckInProgress = ref.watch(backupVerificationProvider);

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
