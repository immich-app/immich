import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/notification_permission.provider.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationSetting extends HookConsumerWidget {
  const NotificationSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissionService = ref.watch(notificationPermissionProvider);
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
            TextButton(child: const Text('cancel').tr(), onPressed: () => ctx.pop()),
            TextButton(onPressed: () => openAppNotificationSettings(ctx), child: const Text('settings').tr()),
          ],
        ),
      );
    }

    final notificationSettings = [
      if (!hasPermission)
        SettingsButtonListTile(
          icon: Icons.notifications_outlined,
          title: 'notification_permission_list_tile_title'.tr(),
          subtileText: 'notification_permission_list_tile_content'.tr(),
          buttonText: 'notification_permission_list_tile_enable_button'.tr(),
          onButtonTap: () =>
              ref.watch(notificationPermissionProvider.notifier).requestNotificationPermission().then((permission) {
                if (permission == PermissionStatus.permanentlyDenied) {
                  showPermissionsDialog();
                }
              }),
        ),
    ];

    return SettingsSubPageScaffold(settings: notificationSettings);
  }
}
