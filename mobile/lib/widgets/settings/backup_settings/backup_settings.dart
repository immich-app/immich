import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/backup_verification.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
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
    final albumSync = useAppSettingsState(AppSettingsEnum.syncAlbums);
    final isCorruptCheckInProgress = ref.watch(backupVerificationProvider);
    final isAlbumSyncInProgress = useState(false);

    syncAlbums() async {
      isAlbumSyncInProgress.value = true;
      try {
        await ref.read(assetServiceProvider).syncUploadedAssetToAlbums();
      } catch (_) {
      } finally {
        Future.delayed(const Duration(seconds: 1), () {
          isAlbumSyncInProgress.value = false;
        });
      }
    }

    final backupSettings = [
      const ForegroundBackupSettings(),
      const BackgroundBackupSettings(),
      if (Platform.isIOS)
        SettingsSwitchListTile(
          valueNotifier: ignoreIcloudAssets,
          title: 'ignore_icloud_photos'.tr(),
          subtitle: 'ignore_icloud_photos_description'.tr(),
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
      if (albumSync.value)
        SettingsButtonListTile(
          icon: Icons.photo_album_outlined,
          title: 'sync_albums'.tr(),
          subtitle: Text(
            "sync_albums_manual_subtitle".tr(),
          ),
          buttonText: 'sync_albums'.tr(),
          child: isAlbumSyncInProgress.value
              ? const CircularProgressIndicator.adaptive(
                  strokeWidth: 2,
                )
              : ElevatedButton(
                  onPressed: syncAlbums,
                  child: Text('sync'.tr()),
                ),
        ),
    ];

    return SettingsSubPageScaffold(
      settings: backupSettings,
      showDivider: true,
    );
  }
}
