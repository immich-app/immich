import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/ios_background_settings.provider.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/widgets/backup/ios_debug_info_tile.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/ios_permission_request.dart';
import 'package:immich_mobile/widgets/settings/core/setting_info.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class BackgroundBackupSettings extends HookConsumerWidget {
  const BackgroundBackupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void showErrorToUser(String msg) {
      final snackBar = SnackBar(
        content: Text(
          msg.t(context: context),
          style: context.textTheme.bodyLarge?.copyWith(),
        ),
      );
      context.scaffoldMessenger.showSnackBar(snackBar);
    }

    void showBatteryOptimizationInfoToUser() {
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext ctx) {
          return AlertDialog(
            title: const Text(
              'backup_controller_page_background_battery_info_title',
            ).t(context: ctx),
            content: SingleChildScrollView(
              child: const Text(
                'backup_controller_page_background_battery_info_message',
              ).t(context: ctx),
            ),
            actions: [
              ElevatedButton(
                onPressed: () => launchUrl(
                  Uri.parse('https://dontkillmyapp.com'),
                  mode: LaunchMode.externalApplication,
                ),
                child: const Text(
                  "backup_controller_page_background_battery_info_link",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ).t(context: ctx),
              ),
              ElevatedButton(
                child: const Text(
                  'backup_controller_page_background_battery_info_ok',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ).t(context: ctx),
                onPressed: () => ctx.pop(),
              ),
            ],
          );
        },
      );
    }

    final isBackgroundEnabled =
        ref.watch(backupProvider.select((s) => s.backgroundBackup));
    final isBackgroundEnabledNotifier = useValueNotifier(isBackgroundEnabled);
    useValueChanged(
      isBackgroundEnabled,
      (_, __) => WidgetsBinding.instance.addPostFrameCallback(
        (_) => isBackgroundEnabledNotifier.value = isBackgroundEnabled,
      ),
    );
    final iosSettings = ref.watch(iOSBackgroundSettingsProvider);
    final hasIosPermissions =
        !Platform.isIOS || iosSettings?.appRefreshEnabled == true;

    final subtitle = isBackgroundEnabled
        ? 'backup_controller_page_background_is_on'.t(context: context)
        : 'backup_controller_page_background_is_off'.t(context: context);

    return SettingsCardLayout(
      header: SettingSectionHeader(
        title: 'backup_controller_page_background_title'.t(context: context),
        icon: Icons.refresh_rounded,
      ),
      children: [
        if (hasIosPermissions) ...[
          const SettingInfo(
            padding: EdgeInsets.only(top: 4),
            text: 'backup_controller_page_background_description',
          ),
          SettingSwitchListTile(
            valueNotifier: isBackgroundEnabledNotifier,
            title:
                'backup_controller_page_background_title'.t(context: context),
            subtitle: subtitle,
            onChanged: (enabled) =>
                ref.read(backupProvider.notifier).configureBackgroundBackup(
                      enabled: enabled,
                      onError: showErrorToUser,
                      onBatteryInfo: showBatteryOptimizationInfoToUser,
                    ),
          ),
          if (isBackgroundEnabled) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Divider(
                height: 1,
                color: context.colorScheme.outline.withValues(alpha: 0.2),
              ),
            ),
            _BackgroundOptionsSection(
              onError: showErrorToUser,
              onBatteryInfo: showBatteryOptimizationInfoToUser,
            ),
            if (Platform.isIOS) const IosDebugInfoTile(),
          ],
        ],
        if (!hasIosPermissions) const IosPermissionRequest(),
      ],
    );
  }
}

class _BackgroundOptionsSection extends HookConsumerWidget {
  final void Function(String msg) onError;
  final void Function() onBatteryInfo;

  const _BackgroundOptionsSection({
    required this.onError,
    required this.onBatteryInfo,
  });

  static int _backupDelayToSliderValue(int ms) => switch (ms) {
        5000 => 0,
        30000 => 1,
        120000 => 2,
        _ => 3,
      };

  static int _backupDelayToMilliseconds(int v) =>
      switch (v) { 0 => 5000, 1 => 30000, 2 => 120000, _ => 600000 };

  static String _formatBackupDelaySliderValue(int v) => switch (v) {
        0 => 'setting_notifications_notify_seconds'.t(args: {'count': '5'}),
        1 => 'setting_notifications_notify_seconds'.t(args: {'count': '30'}),
        2 => 'setting_notifications_notify_minutes'.t(args: {'count': '2'}),
        _ => 'setting_notifications_notify_minutes'.t(args: {'count': '10'}),
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isWifiRequired =
        ref.watch(backupProvider.select((s) => s.backupRequireWifi));
    final isWifiRequiredNotifier = useValueNotifier(isWifiRequired);
    useValueChanged(
      isWifiRequired,
      (_, __) => WidgetsBinding.instance.addPostFrameCallback(
        (_) => isWifiRequiredNotifier.value = isWifiRequired,
      ),
    );

    final isChargingRequired =
        ref.watch(backupProvider.select((s) => s.backupRequireCharging));
    final isChargingRequiredNotifier = useValueNotifier(isChargingRequired);
    useValueChanged(
      isChargingRequired,
      (_, __) => WidgetsBinding.instance.addPostFrameCallback(
        (_) => isChargingRequiredNotifier.value = isChargingRequired,
      ),
    );

    final backupTriggerDelay =
        ref.watch(backupProvider.select((s) => s.backupTriggerDelay));
    final triggerDelay =
        useState(_backupDelayToSliderValue(backupTriggerDelay));
    useValueChanged(
      triggerDelay.value,
      (_, __) => ref.read(backupProvider.notifier).configureBackgroundBackup(
            triggerDelay: _backupDelayToMilliseconds(triggerDelay.value),
            onError: onError,
            onBatteryInfo: onBatteryInfo,
          ),
    );

    return Column(
      children: [
        SettingSwitchListTile(
          valueNotifier: isWifiRequiredNotifier,
          title: 'backup_controller_page_background_wifi'.t(context: context),
          icon: Icons.wifi,
          onChanged: (enabled) =>
              ref.read(backupProvider.notifier).configureBackgroundBackup(
                    requireWifi: enabled,
                    onError: onError,
                    onBatteryInfo: onBatteryInfo,
                  ),
        ),
        SettingSwitchListTile(
          valueNotifier: isChargingRequiredNotifier,
          title:
              'backup_controller_page_background_charging'.t(context: context),
          icon: Icons.charging_station,
          onChanged: (enabled) =>
              ref.read(backupProvider.notifier).configureBackgroundBackup(
                    requireCharging: enabled,
                    onError: onError,
                    onBatteryInfo: onBatteryInfo,
                  ),
        ),
        if (Platform.isAndroid)
          SettingSliderListTile(
            valueNotifier: triggerDelay,
            title: 'backup_controller_page_background_delay'.t(
              context: context,
              args: {
                'duration': _formatBackupDelaySliderValue(triggerDelay.value),
              },
            ),
            max: 3.0,
            divisions: 3,
            label: _formatBackupDelaySliderValue(triggerDelay.value),
          ),
      ],
    );
  }
}
