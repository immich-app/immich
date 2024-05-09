import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/ios_background_settings.provider.dart';
import 'package:immich_mobile/widgets/backup/ios_debug_info_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';

class BackgroundBackupSettings extends ConsumerWidget {
  const BackgroundBackupSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isBackgroundEnabled =
        ref.watch(backupProvider.select((s) => s.backgroundBackup));
    final iosSettings = ref.watch(iOSBackgroundSettingsProvider);

    void showErrorToUser(String msg) {
      final snackBar = SnackBar(
        content: Text(
          msg.tr(),
          style: context.textTheme.bodyLarge?.copyWith(
            color: context.primaryColor,
          ),
        ),
        backgroundColor: Colors.red,
      );
      ScaffoldMessenger.of(context).showSnackBar(snackBar);
    }

    void showBatteryOptimizationInfoToUser() {
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext ctx) {
          return AlertDialog(
            title: const Text(
              'backup_controller_page_background_battery_info_title',
            ).tr(),
            content: SingleChildScrollView(
              child: const Text(
                'backup_controller_page_background_battery_info_message',
              ).tr(),
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
                ).tr(),
              ),
              ElevatedButton(
                child: const Text(
                  'backup_controller_page_background_battery_info_ok',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ).tr(),
                onPressed: () => ctx.pop(),
              ),
            ],
          );
        },
      );
    }

    if (!isBackgroundEnabled) {
      return SettingsButtonListTile(
        icon: Icons.cloud_sync_outlined,
        title: 'backup_controller_page_background_is_off'.tr(),
        subtileText: 'backup_controller_page_background_description'.tr(),
        buttonText: 'backup_controller_page_background_turn_on'.tr(),
        onButtonTap: () =>
            ref.read(backupProvider.notifier).configureBackgroundBackup(
                  enabled: true,
                  onError: showErrorToUser,
                  onBatteryInfo: showBatteryOptimizationInfoToUser,
                ),
      );
    }

    return Column(
      children: [
        if (!Platform.isIOS || iosSettings?.appRefreshEnabled == true)
          _BackgroundSettingsEnabled(
            onError: showErrorToUser,
            onBatteryInfo: showBatteryOptimizationInfoToUser,
          ),
        if (Platform.isIOS && iosSettings?.appRefreshEnabled != true)
          _IOSBackgroundRefreshDisabled(),
        if (Platform.isIOS && iosSettings != null)
          IosDebugInfoTile(settings: iosSettings),
      ],
    );
  }
}

class _IOSBackgroundRefreshDisabled extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SettingsButtonListTile(
      icon: Icons.task_outlined,
      title:
          'backup_controller_page_background_app_refresh_disabled_title'.tr(),
      subtileText:
          'backup_controller_page_background_app_refresh_disabled_content'.tr(),
      buttonText:
          'backup_controller_page_background_app_refresh_enable_button_text'
              .tr(),
      onButtonTap: () => openAppSettings(),
    );
  }
}

class _BackgroundSettingsEnabled extends HookConsumerWidget {
  final void Function(String msg) onError;
  final void Function() onBatteryInfo;

  const _BackgroundSettingsEnabled({
    required this.onError,
    required this.onBatteryInfo,
  });

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

    int backupDelayToSliderValue(int ms) => switch (ms) {
          5000 => 0,
          30000 => 1,
          120000 => 2,
          _ => 3,
        };

    int backupDelayToMilliseconds(int v) =>
        switch (v) { 0 => 5000, 1 => 30000, 2 => 120000, _ => 600000 };

    String formatBackupDelaySliderValue(int v) => switch (v) {
          0 => 'setting_notifications_notify_seconds'.tr(args: const ['5']),
          1 => 'setting_notifications_notify_seconds'.tr(args: const ['30']),
          2 => 'setting_notifications_notify_minutes'.tr(args: const ['2']),
          _ => 'setting_notifications_notify_minutes'.tr(args: const ['10']),
        };

    final backupTriggerDelay =
        ref.watch(backupProvider.select((s) => s.backupTriggerDelay));
    final triggerDelay = useState(backupDelayToSliderValue(backupTriggerDelay));
    useValueChanged(
      triggerDelay.value,
      (_, __) => ref.read(backupProvider.notifier).configureBackgroundBackup(
            triggerDelay: backupDelayToMilliseconds(triggerDelay.value),
            onError: onError,
            onBatteryInfo: onBatteryInfo,
          ),
    );

    return SettingsButtonListTile(
      icon: Icons.cloud_sync_rounded,
      iconColor: context.primaryColor,
      title: 'backup_controller_page_background_is_on'.tr(),
      buttonText: 'backup_controller_page_background_turn_off'.tr(),
      onButtonTap: () =>
          ref.read(backupProvider.notifier).configureBackgroundBackup(
                enabled: false,
                onError: onError,
                onBatteryInfo: onBatteryInfo,
              ),
      subtitle: Column(
        children: [
          SettingsSwitchListTile(
            valueNotifier: isWifiRequiredNotifier,
            title: 'backup_controller_page_background_wifi'.tr(),
            icon: Icons.wifi,
            onChanged: (enabled) =>
                ref.read(backupProvider.notifier).configureBackgroundBackup(
                      requireWifi: enabled,
                      onError: onError,
                      onBatteryInfo: onBatteryInfo,
                    ),
          ),
          SettingsSwitchListTile(
            valueNotifier: isChargingRequiredNotifier,
            title: 'backup_controller_page_background_charging'.tr(),
            icon: Icons.charging_station,
            onChanged: (enabled) =>
                ref.read(backupProvider.notifier).configureBackgroundBackup(
                      requireCharging: enabled,
                      onError: onError,
                      onBatteryInfo: onBatteryInfo,
                    ),
          ),
          if (Platform.isAndroid)
            SettingsSliderListTile(
              valueNotifier: triggerDelay,
              text: 'backup_controller_page_background_delay'.tr(
                args: [formatBackupDelaySliderValue(triggerDelay.value)],
              ),
              maxValue: 3.0,
              noDivisons: 3,
              label: formatBackupDelaySliderValue(triggerDelay.value),
            ),
        ],
      ),
    );
  }
}
