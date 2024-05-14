import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationPermissionNotifier extends StateNotifier<PermissionStatus> {
  NotificationPermissionNotifier()
      : super(
          Platform.isAndroid
              ? PermissionStatus.granted
              : PermissionStatus.restricted,
        ) {
    // Sets the initial state
    getNotificationPermission().then((p) => state = p);
  }

  /// Requests the notification permission
  /// Note: In Android, this is always granted
  Future<PermissionStatus> requestNotificationPermission() async {
    final permission = await Permission.notification.request();
    state = permission;
    return permission;
  }

  /// Whether the user has the permission or not
  /// Note: In Android, this is always true
  Future<bool> hasNotificationPermission() {
    return Permission.notification.isGranted;
  }

  Future<PermissionStatus> getNotificationPermission() async {
    final status = await Permission.notification.status;
    state = status;
    return status;
  }

  /// Either the permission was granted already or else ask for the permission
  Future<bool> hasOrAskForNotificationPermission() {
    return requestNotificationPermission().then((p) => p.isGranted);
  }
}

final notificationPermissionProvider =
    StateNotifierProvider<NotificationPermissionNotifier, PermissionStatus>(
  (ref) => NotificationPermissionNotifier(),
);
