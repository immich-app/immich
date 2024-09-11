import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/notification_permission.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationSetting extends HookConsumerWidget {
  const NotificationSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissionService = ref.watch(notificationPermissionProvider);

    final sliderValue =
        useAppSettingsState(AppSettingsEnum.uploadErrorNotificationGracePeriod);
    final totalProgressValue =
        useAppSettingsState(AppSettingsEnum.backgroundBackupTotalProgress);
    final singleProgressValue =
        useAppSettingsState(AppSettingsEnum.backgroundBackupSingleProgress);

    final hasPermission = permissionService == PermissionStatus.granted;

    openAppNotificationSettings(BuildContext ctx) {
      ctx.pop();
      openAppSettings();
    }

    // When permissions are permanently denied, you need to go to settings to
    // allow them
    showPermissionsDialog() {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          content: const Text('notification_permission_dialog_content').tr(),
          actions: [
            TextButton(
              child: const Text('notification_permission_dialog_cancel').tr(),
              onPressed: () => ctx.pop(),
            ),
            TextButton(
              onPressed: () => openAppNotificationSettings(ctx),
              child: const Text('notification_permission_dialog_settings').tr(),
            ),
          ],
        ),
      );
    }

    final String formattedValue =
        _formatSliderValue(sliderValue.value.toDouble());

    final notificationSettings = [
      if (!hasPermission)
        SettingsButtonListTile(
          icon: Icons.notifications_outlined,
          title: 'notification_permission_list_tile_title'.tr(),
          subtileText: 'notification_permission_list_tile_content'.tr(),
          buttonText: 'notification_permission_list_tile_enable_button'.tr(),
          onButtonTap: () => ref
              .watch(notificationPermissionProvider.notifier)
              .requestNotificationPermission()
              .then((permission) {
            if (permission == PermissionStatus.permanentlyDenied) {
              showPermissionsDialog();
            }
          }),
        ),
      SettingsSwitchListTile(
        enabled: hasPermission,
        valueNotifier: totalProgressValue,
        title: 'setting_notifications_total_progress_title'.tr(),
        subtitle: 'setting_notifications_total_progress_subtitle'.tr(),
      ),
      SettingsSwitchListTile(
        enabled: hasPermission,
        valueNotifier: singleProgressValue,
        title: 'setting_notifications_single_progress_title'.tr(),
        subtitle: 'setting_notifications_single_progress_subtitle'.tr(),
      ),
      SettingsSliderListTile(
        enabled: hasPermission,
        valueNotifier: sliderValue,
        text: 'setting_notifications_notify_failures_grace_period'
            .tr(args: [formattedValue]),
        maxValue: 5.0,
        noDivisons: 5,
        label: formattedValue,
      ),
    ];

    return SettingsSubPageScaffold(settings: notificationSettings);
  }
}

String _formatSliderValue(double v) {
  if (v == 0.0) {
    return 'setting_notifications_notify_immediately'.tr();
  } else if (v == 1.0) {
    return 'setting_notifications_notify_minutes'.tr(args: const ['30']);
  } else if (v == 2.0) {
    return 'setting_notifications_notify_hours'.tr(args: const ['2']);
  } else if (v == 3.0) {
    return 'setting_notifications_notify_hours'.tr(args: const ['8']);
  } else if (v == 4.0) {
    return 'setting_notifications_notify_hours'.tr(args: const ['24']);
  } else {
    return 'setting_notifications_notify_never'.tr();
  }
}
