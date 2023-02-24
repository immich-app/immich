import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/providers/notification_permission.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/modules/settings/ui/settings_switch_list_tile.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationSetting extends HookConsumerWidget {
  const NotificationSetting({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);
    final permissionService = ref.watch(notificationPermissionProvider);

    final sliderValue = useState(0.0);
    final totalProgressValue =
        useState(AppSettingsEnum.backgroundBackupTotalProgress.defaultValue);
    final singleProgressValue =
        useState(AppSettingsEnum.backgroundBackupSingleProgress.defaultValue);
    final hasPermission = permissionService == PermissionStatus.granted;

    useEffect(
      () {
        sliderValue.value = appSettingService
            .getSetting<int>(AppSettingsEnum.uploadErrorNotificationGracePeriod)
            .toDouble();
        totalProgressValue.value = appSettingService
            .getSetting<bool>(AppSettingsEnum.backgroundBackupTotalProgress);
        singleProgressValue.value = appSettingService
            .getSetting<bool>(AppSettingsEnum.backgroundBackupSingleProgress);
        return null;
      },
      [],
    );

    // When permissions are permanently denied, you need to go to settings to
    // allow them
    showPermissionsDialog() {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          content: const Text('notification_permission_dialog_content').tr(),
          actions: [
            TextButton(
              child: const Text('notification_permission_dialog_cancel').tr(),
              onPressed: () => Navigator.of(context).pop(),
            ),
            TextButton(
              child: const Text('notification_permission_dialog_settings').tr(),
              onPressed: () {
                Navigator.of(context).pop();
                openAppSettings();
              },
            ),
          ],
        ),
      );
    }

    final String formattedValue = _formatSliderValue(sliderValue.value);
    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'setting_notifications_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'setting_notifications_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        if (!hasPermission)
          ListTile(
            leading: const Icon(Icons.notifications_outlined),
            title: const Text('notification_permission_list_tile_title').tr(),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('notification_permission_list_tile_content').tr(),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: ()
                  => ref.watch(notificationPermissionProvider.notifier)
                    .requestNotificationPermission().then((permission) {
                      if (permission == PermissionStatus.permanentlyDenied) {
                        showPermissionsDialog();
                      }
                  }),
                  child:
                  const Text('notification_permission_list_tile_enable_button')
                    .tr(),
                ),
              ],
            ),
            isThreeLine: true,
          ),
        SettingsSwitchListTile(
          enabled: hasPermission,
          appSettingService: appSettingService,
          valueNotifier: totalProgressValue,
          settingsEnum: AppSettingsEnum.backgroundBackupTotalProgress,
          title: 'setting_notifications_total_progress_title'.tr(),
          subtitle: 'setting_notifications_total_progress_subtitle'.tr(),
        ),
        SettingsSwitchListTile(
          enabled: hasPermission,
          appSettingService: appSettingService,
          valueNotifier: singleProgressValue,
          settingsEnum: AppSettingsEnum.backgroundBackupSingleProgress,
          title: 'setting_notifications_single_progress_title'.tr(),
          subtitle: 'setting_notifications_single_progress_subtitle'.tr(),
        ),
        ListTile(
          enabled: hasPermission,
          isThreeLine: false,
          dense: true,
          title: const Text(
            'setting_notifications_notify_failures_grace_period',
            style: TextStyle(fontWeight: FontWeight.bold),
          ).tr(args: [formattedValue]),
          subtitle: Slider(
            value: sliderValue.value,
            onChanged: !hasPermission ? null : (double v) => sliderValue.value = v,
            onChangeEnd: (double v) => appSettingService.setSetting(
              AppSettingsEnum.uploadErrorNotificationGracePeriod,
              v.toInt(),
            ),
            max: 5.0,
            divisions: 5,
            label: formattedValue,
            activeColor: Theme.of(context).primaryColor,
          ),
        ),
      ],
    );
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
