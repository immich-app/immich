import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/backup_verification.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/widgets/common/responsive_button.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/background_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/foreground_settings.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
import 'package:immich_mobile/widgets/settings/core/setting_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

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

    final backupSettings = [
      const ForegroundBackupSettings(),
      const BackgroundBackupSettings(),
      if (Platform.isIOS)
        SettingsCardLayout(
          children: [
            SettingSwitchListTile(
              valueNotifier: ignoreIcloudAssets,
              title: 'ignore_icloud_photos'.tr(),
              subtitle: 'ignore_icloud_photos_description'.tr(),
            ),
          ],
        ),
      if (Platform.isAndroid && isAdvancedTroubleshooting.value)
        const _CheckCorruptAssetSettings(),
      if (albumSync.value) const _SyncAlbumsSettings(),
    ];

    return SettingsSubPageScaffold(
      settings: backupSettings,
      showDivider: false,
    );
  }
}

class _SyncAlbumsSettings extends HookConsumerWidget {
  const _SyncAlbumsSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isAlbumSyncInProgress = useState(false);

    Future<void> syncAlbums() async {
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

    return SettingsCardLayout(
      children: [
        SettingButtonListTile(
          title: 'sync_albums'.tr(),
          subtileText: "sync_albums_manual_subtitle".tr(),
          buttonText: 'sync'.tr(),
          child: ResponsiveButton(
            onPressed: !isAlbumSyncInProgress.value ? syncAlbums : null,
            child: isAlbumSyncInProgress.value
                ? const SizedBox.square(
                    dimension: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    'sync'.tr(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}

class _CheckCorruptAssetSettings extends ConsumerWidget {
  const _CheckCorruptAssetSettings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCorruptCheckInProgress = ref.watch(backupVerificationProvider);

    void handleCheckCorruptAsset() {
      ref.read(backupVerificationProvider.notifier).performBackupCheck(context);
    }

    return SettingsCardLayout(
      children: [
        SettingButtonListTile(
          title: 'check_corrupt_asset_backup'.tr(),
          subtileText: 'check_corrupt_asset_backup_description'.tr(),
          buttonText: 'check_corrupt_asset_backup_button'.tr(),
          child: ResponsiveButton(
            onPressed:
                !isCorruptCheckInProgress ? handleCheckCorruptAsset : null,
            child: isCorruptCheckInProgress
                ? const SizedBox.square(
                    dimension: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    'check_corrupt_asset_backup_button'.tr(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
      ],
    );
  }
}
