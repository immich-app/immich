import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/ios_background_settings.provider.dart';
import 'package:immich_mobile/widgets/backup/ios_debug_info_tile.dart';
import 'package:immich_mobile/widgets/common/responsive_button.dart';
import 'package:immich_mobile/widgets/settings/core/setting_permission_request.dart';
import 'package:immich_mobile/widgets/settings/core/setting_info.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
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
            color: context.colorScheme.onError,
          ),
        ),
        backgroundColor: context.colorScheme.error,
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

    void turnOnBackgroundBackup() {
      ref.read(backupProvider.notifier).configureBackgroundBackup(
            enabled: true,
            onError: showErrorToUser,
            onBatteryInfo: showBatteryOptimizationInfoToUser,
          );
    }

    if (!isBackgroundEnabled) {
      return SettingsCardLayout(
        contentSpacing: 8,
        header: SettingIndicatorSectionHeader(
          padding: const EdgeInsets.only(top: 12, left: 16, right: 16),
          title: 'backup_controller_page_background_title'.tr(),
          subtitle: 'backup_controller_page_background_off_subtitle'.tr(),
          indicatorState: IndicatorState.disabled,
        ),
        children: [
          const SettingInfo(
            text: 'backup_controller_page_background_description',
          ),
          Center(
            child: ResponsiveButton(
              onPressed: turnOnBackgroundBackup,
              child: Text(
                'backup_controller_page_background_turn_on'.tr(),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ),
          const SizedBox(height: 4),
        ],
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
          SettingPermissionRequest(
            padding: const EdgeInsets.all(16),
            icon: Icons.refresh_rounded,
            title:
                'backup_controller_page_background_app_refresh_disabled_title'
                    .tr(),
            subtitle:
                'backup_controller_page_background_app_refresh_disabled_content'
                    .tr(),
            buttonText:
                'backup_controller_page_background_app_refresh_enable_button_text'
                    .tr(),
            buttonIcon: Icons.settings_outlined,
            onHandleAction: () => openAppSettings(),
            colorScheme: PermissionColorScheme.warning,
          ),
      ],
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
          0 => 'setting_notifications_notify_seconds'
              .tr(namedArgs: {'count': '5'}),
          1 => 'setting_notifications_notify_seconds'
              .tr(namedArgs: {'count': '30'}),
          2 => 'setting_notifications_notify_minutes'
              .tr(namedArgs: {'count': '2'}),
          _ => 'setting_notifications_notify_minutes'
              .tr(namedArgs: {'count': '10'}),
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
    return SettingsCardLayout(
      contentSpacing: 4,
      header: SettingIndicatorSectionHeader(
        padding: const EdgeInsets.only(top: 12, left: 16, right: 16),
        title: 'backup_controller_page_background_title'.tr(),
        subtitle: 'backup_controller_page_background_on_subtitle'.tr(),
        indicatorState: IndicatorState.enabled,
      ),
      children: [
        Center(
          child: ResponsiveButton(
            onPressed: () =>
                ref.read(backupProvider.notifier).configureBackgroundBackup(
                      enabled: false,
                      onError: onError,
                      onBatteryInfo: onBatteryInfo,
                    ),
            child: Text(
              'backup_controller_page_background_turn_off'.tr(),
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 16),
          child: Divider(
            height: 1,
            color: context.colorScheme.outline.withValues(alpha: 0.2),
          ),
        ),
        SettingSwitchListTile(
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
        SettingSwitchListTile(
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
        if (Platform.isAndroid) ...[
          SettingSliderListTile(
            valueNotifier: triggerDelay,
            title: 'backup_controller_page_background_delay'.tr(
              namedArgs: {
                'duration': formatBackupDelaySliderValue(triggerDelay.value),
              },
            ),
            max: 3.0,
            divisions: 3,
            showValue: false,
            label: formatBackupDelaySliderValue(triggerDelay.value),
          ),
        ],
        if (Platform.isIOS) const IosDebugInfoTile(),
      ],
    );
  }
}
