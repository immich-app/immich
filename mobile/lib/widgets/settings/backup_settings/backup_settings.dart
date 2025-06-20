import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/background_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/check_corrupt_asset.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/foreground_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/ignore_icloud_assets.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/sync_albums.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class BackupSettings extends HookConsumerWidget {
  const BackupSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAdvancedTroubleshooting =
        useAppSettingsState(AppSettingsEnum.advancedTroubleshooting);
    final albumSync = useAppSettingsState(AppSettingsEnum.syncAlbums);

    final backupSettings = [
      const ForegroundBackupSettings(),
      const BackgroundBackupSettings(),
      if (Platform.isIOS) const IgnoreIcloudAssetsSetting(),
      if (Platform.isAndroid && isAdvancedTroubleshooting.value)
        const CheckCorruptAssetSetting(),
      if (albumSync.value) const SyncAlbumsSetting(),
    ];

    return SettingsSubPageScaffold(
      settings: backupSettings,
    );
  }
}
