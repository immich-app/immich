import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/notification_permission.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/core/setting_permission_request.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_sub_page_scaffold.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
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

    showPermissionsDialog() {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          content: Text(
            'notification_permission_dialog_content'.t(context: context),
          ),
          actions: [
            TextButton(
              child: Text('cancel'.t(context: ctx)),
              onPressed: () => ctx.pop(),
            ),
            TextButton(
              onPressed: () => openAppNotificationSettings(ctx),
              child: Text('settings'.t(context: ctx)),
            ),
          ],
        ),
      );
    }

    final String formattedValue =
        _formatSliderValue(sliderValue.value.toDouble());

    final notificationSettings = [
      if (!hasPermission)
        SettingPermissionRequest(
          padding: const EdgeInsets.all(16),
          icon: Icons.notifications_off_rounded,
          title: 'notification_permission_list_tile_title'.t(context: context),
          subtitle:
              'notification_permission_list_tile_content'.t(context: context),
          buttonText: 'notification_permission_list_tile_enable_button'
              .t(context: context),
          buttonIcon: Icons.notifications_active_rounded,
          onHandleAction: () => ref
              .watch(notificationPermissionProvider.notifier)
              .requestNotificationPermission()
              .then((permission) {
            if (permission == PermissionStatus.permanentlyDenied) {
              showPermissionsDialog();
            }
          }),
          colorScheme: PermissionColorScheme.warning,
          useCard: true,
        ),
      SettingsCardLayout(
        header: const SettingSectionHeader(
          title: "Placeholder",
        ),
        children: [
          SettingSwitchListTile(
            enabled: hasPermission,
            valueNotifier: totalProgressValue,
            title: 'setting_notifications_total_progress_title'
                .t(context: context),
            subtitle: 'setting_notifications_total_progress_subtitle'
                .t(context: context),
          ),
          SettingSwitchListTile(
            enabled: hasPermission,
            valueNotifier: singleProgressValue,
            title: 'setting_notifications_single_progress_title'
                .t(context: context),
            subtitle: 'setting_notifications_single_progress_subtitle'
                .t(context: context),
          ),
        ],
      ),
      SettingsCardLayout(
        header: const SettingSectionHeader(
          title: "Placeholder",
        ),
        children: [
          SettingSliderListTile(
            title: 'setting_notifications_notify_failures_grace_period'
                .t(context: context, args: {'duration': formattedValue}),
            label: formattedValue,
            valueNotifier: sliderValue,
            max: 5,
            divisions: 5,
            enabled: hasPermission,
          ),
        ],
      ),
    ];

    return SettingsSubPageScaffold(settings: notificationSettings);
  }
}

String _formatSliderValue(double v) {
  if (v == 0.0) {
    return 'setting_notifications_notify_immediately'.t();
  } else if (v == 1.0) {
    return 'setting_notifications_notify_minutes'.t(args: {'count': '30'});
  } else if (v == 2.0) {
    return 'setting_notifications_notify_hours'.t(args: {'count': '2'});
  } else if (v == 3.0) {
    return 'setting_notifications_notify_hours'.t(args: {'count': '8'});
  } else if (v == 4.0) {
    return 'setting_notifications_notify_hours'.t(args: {'count': '24'});
  } else {
    return 'setting_notifications_notify_never'.t();
  }
}
