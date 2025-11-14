import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/backup_verification.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/background_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/foreground_settings.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

const List<int> _uploadLimitOptions = [
  0,
  10 * 1024 * 1024,
  50 * 1024 * 1024,
  100 * 1024 * 1024,
  1024 * 1024 * 1024,
  5 * 1024 * 1024 * 1024,
  10 * 1024 * 1024 * 1024,
];

class BackupSettings extends HookConsumerWidget {
  const BackupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ignoreIcloudAssets = useAppSettingsState(AppSettingsEnum.ignoreIcloudAssets);
    final isAdvancedTroubleshooting = useAppSettingsState(AppSettingsEnum.advancedTroubleshooting);
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

      int resolveLimitIndex(int value) {
        final idx = _uploadLimitOptions.indexOf(value);
        return idx >= 0 ? idx : 0;
      }

      final uploadLimitSetting = useAppSettingsState(AppSettingsEnum.maxUploadFileSize);
      final uploadLimitIndex = useState(resolveLimitIndex(uploadLimitSetting.value));
      useValueChanged(uploadLimitSetting.value, (_, __) {
        final next = resolveLimitIndex(uploadLimitSetting.value);
        if (uploadLimitIndex.value != next) {
          uploadLimitIndex.value = next;
        }
      });

      String formatLimitLabel(int bytes) {
        return bytes <= 0 ? 'backup_upload_limit_unlimited'.tr() : formatBytes(bytes);
      }

      final backupSettings = [
      const ForegroundBackupSettings(),
        SettingsSliderListTile(
          valueNotifier: uploadLimitIndex,
          text: 'backup_upload_limit_title'.tr(
            args: {'size': formatLimitLabel(_uploadLimitOptions[uploadLimitIndex.value])},
          ),
          maxValue: (_uploadLimitOptions.length - 1).toDouble(),
          noDivisons: _uploadLimitOptions.length - 1,
          label: formatLimitLabel(_uploadLimitOptions[uploadLimitIndex.value]),
          onChangeEnd: (value) => uploadLimitSetting.value = _uploadLimitOptions[value],
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'backup_upload_limit_description'.tr(),
              style: context.textTheme.bodySmall,
            ),
          ),
        ),
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
          title: 'check_corrupt_asset_backup'.tr(),
          subtitle: isCorruptCheckInProgress
              ? const Column(
                  children: [
                    SizedBox(height: 20),
                    Center(child: CircularProgressIndicator()),
                    SizedBox(height: 20),
                  ],
                )
              : null,
          subtileText: !isCorruptCheckInProgress ? 'check_corrupt_asset_backup_description'.tr() : null,
          buttonText: 'check_corrupt_asset_backup_button'.tr(),
          onButtonTap: !isCorruptCheckInProgress
              ? () => ref.read(backupVerificationProvider.notifier).performBackupCheck(context)
              : null,
        ),
      if (albumSync.value)
        SettingsButtonListTile(
          icon: Icons.photo_album_outlined,
          title: 'sync_albums'.tr(),
          subtitle: Text("sync_albums_manual_subtitle".tr()),
          buttonText: 'sync_albums'.tr(),
          child: isAlbumSyncInProgress.value
              ? const CircularProgressIndicator()
              : ElevatedButton(onPressed: syncAlbums, child: Text('sync'.tr())),
        ),
    ];

    return SettingsSubPageScaffold(settings: backupSettings, showDivider: true);
  }
}
