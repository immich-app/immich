import 'package:permission_handler/permission_handler.dart';

/// This class is for requesting permissions in the app
class PermissionService {
  /// Requests the notification permission
  /// Note: In Android, this is always granted
  Future<PermissionStatus> requestNotificationPermission() {
    return Permission.notification.request();
  }

  /// Whether the user has the permission or not
  /// Note: In Android, this is always true
  Future<bool> hasNotificationPermission() {
    return Permission.notification.isGranted;
  }

  /// Either the permission was granted already or else ask for the permission
  Future<bool> hasOrAskForNotificationPermission() {
    return requestNotificationPermission().then((p) => p.isGranted);
  }
}
