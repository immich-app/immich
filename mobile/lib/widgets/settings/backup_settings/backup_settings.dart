import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/backup_verification.provider.dart';
import 'package:immich_mobile/services/adaptive_throttle.service.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/asset.service.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/background_settings.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/foreground_settings.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

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
      // Adaptive throttle settings (always visible for testing)
      _AdaptiveThrottleSettings(),
    ];

    return SettingsSubPageScaffold(settings: backupSettings, showDivider: true);
  }
}

/// Advanced settings for adaptive backup throttling
/// Only visible when advanced troubleshooting is enabled
class _AdaptiveThrottleSettings extends HookConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final throttleController = ref.watch(adaptiveThrottleControllerProvider);
    final backupState = ref.watch(backupProvider);
    final adaptiveState = backupState.adaptiveState;
    
    final isAdaptiveEnabled = useState(true);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.speed, color: context.primaryColor),
                const SizedBox(width: 8),
                Text(
                  'Adaptive Backup Throttling',
                  style: context.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Advanced settings for backup performance tuning',
              style: context.textTheme.bodySmall?.copyWith(
                color: context.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
            const Divider(height: 24),
            
            // Adaptive mode toggle
            SwitchListTile(
              title: const Text('Use Adaptive Throttling'),
              subtitle: const Text('Automatically adjust batch size based on performance'),
              value: isAdaptiveEnabled.value,
              onChanged: (value) {
                isAdaptiveEnabled.value = value;
                ref.read(backupProvider.notifier).setAdaptiveBackupEnabled(value);
              },
              contentPadding: EdgeInsets.zero,
            ),
            
            const Divider(height: 16),
            
            // Current settings display
            Text(
              'Current Settings',
              style: context.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            
            _buildInfoRow(
              context,
              'Batch Size',
              '${adaptiveState?.currentBatchSize ?? throttleController.currentBatchSize} assets',
            ),
            _buildInfoRow(
              context,
              'Delay Between Batches',
              '${adaptiveState?.currentDelayMs ?? throttleController.delayMs} ms',
            ),
            _buildInfoRow(
              context,
              'Status',
              adaptiveState?.statusMessage ?? 'Idle',
            ),
            
            if (adaptiveState?.lastAdjustmentReason != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: context.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      size: 16,
                      color: context.primaryColor,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Last adjustment: ${adaptiveState!.lastAdjustmentReason}',
                        style: context.textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            
            const Divider(height: 24),
            
            // Manual override section (only when adaptive is disabled)
            if (!isAdaptiveEnabled.value) ...[
              Text(
                'Manual Override',
                style: context.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              
              // Batch size slider
              Text('Batch Size: ${throttleController.currentBatchSize}'),
              Slider(
                value: throttleController.currentBatchSize.toDouble(),
                min: 10,
                max: 200,
                divisions: 19,
                label: '${throttleController.currentBatchSize}',
                onChanged: (value) {
                  throttleController.setManualBatchSize(value.round());
                },
              ),
              
              // Delay slider
              Text('Delay: ${throttleController.delayMs} ms'),
              Slider(
                value: throttleController.delayMs.toDouble(),
                min: 0,
                max: 5000,
                divisions: 10,
                label: '${throttleController.delayMs} ms',
                onChanged: (value) {
                  throttleController.setManualDelay(value.round());
                },
              ),
              
              const SizedBox(height: 8),
              Text(
                'Warning: Manual settings may cause performance issues with large libraries.',
                style: context.textTheme.bodySmall?.copyWith(
                  color: Colors.orange,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          Text(
            value,
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
