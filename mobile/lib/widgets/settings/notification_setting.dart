import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/permission.provider.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationSetting extends HookConsumerWidget {
  const NotificationSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final permissionService = ref.watch(notificationPermissionProvider);
    final hasPermission = permissionService == PermissionStatus.granted;

    void openAppNotificationSettings(BuildContext ctx) {
      ctx.pop();
      unawaited(openAppSettings());
    }

    // When permissions are permanently denied, you need to go to settings to
    // allow them
    void showPermissionsDialog() {
      unawaited(
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            content: Text(ctx.t.notification_permission_dialog_content),
            actions: [
              TextButton(child: Text(ctx.t.cancel), onPressed: () => ctx.pop()),
              TextButton(onPressed: () => openAppNotificationSettings(ctx), child: Text(ctx.t.settings)),
            ],
          ),
        ),
      );
    }

    final notificationSettings = [
      if (!hasPermission)
        SettingsButtonListTile(
          icon: Icons.notifications_outlined,
          title: context.t.notification_permission_list_tile_title,
          subtileText: context.t.notification_permission_list_tile_content,
          buttonText: context.t.notification_permission_list_tile_enable_button,
          onButtonTap: () =>
              ref.read(notificationPermissionProvider.notifier).requestNotificationPermission().then((permission) {
                if (permission == PermissionStatus.permanentlyDenied) {
                  showPermissionsDialog();
                }
              }),
        )
      else
        SettingsButtonListTile(
          icon: Icons.notifications_active_outlined,
          title: context.t.notification_enabled_list_tile_title,
          subtileText: context.t.notification_enabled_list_tile_content,
          buttonText: context.t.notification_enabled_list_tile_open_button,
          onButtonTap: () => openAppSettings(),
        ),
    ];

    return SettingsSubPageScaffold(settings: notificationSettings);
  }
}
