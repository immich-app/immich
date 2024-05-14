import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/providers/notification_permission.provider.dart';
import 'package:permission_handler/permission_handler.dart';

final localNotificationService = Provider(
  (ref) => LocalNotificationService(
    ref.watch(notificationPermissionProvider),
    ref,
  ),
);

class LocalNotificationService {
  final FlutterLocalNotificationsPlugin _localNotificationPlugin =
      FlutterLocalNotificationsPlugin();
  final PermissionStatus _permissionStatus;
  final Ref ref;

  LocalNotificationService(this._permissionStatus, this.ref);

  static const manualUploadNotificationID = 4;
  static const manualUploadDetailedNotificationID = 5;
  static const manualUploadChannelName = 'Manual Asset Upload';
  static const manualUploadChannelID = 'immich/manualUpload';
  static const manualUploadChannelNameDetailed = 'Manual Asset Upload Detailed';
  static const manualUploadDetailedChannelID = 'immich/manualUploadDetailed';
  static const cancelUploadActionID = 'cancel_upload';

  Future<void> setup() async {
    const androidSetting = AndroidInitializationSettings('notification_icon');
    const iosSetting = DarwinInitializationSettings();

    const initSettings =
        InitializationSettings(android: androidSetting, iOS: iosSetting);

    await _localNotificationPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse:
          _onDidReceiveForegroundNotificationResponse,
    );
  }

  Future<void> _showOrUpdateNotification(
    int id,
    String title,
    String body,
    AndroidNotificationDetails androidNotificationDetails,
    DarwinNotificationDetails iosNotificationDetails,
  ) async {
    final notificationDetails = NotificationDetails(
      android: androidNotificationDetails,
      iOS: iosNotificationDetails,
    );

    if (_permissionStatus == PermissionStatus.granted) {
      await _localNotificationPlugin.show(id, title, body, notificationDetails);
    }
  }

  Future<void> closeNotification(int id) {
    return _localNotificationPlugin.cancel(id);
  }

  Future<void> showOrUpdateManualUploadStatus(
    String title,
    String body, {
    bool? isDetailed,
    bool? presentBanner,
    bool? showActions,
    int? maxProgress,
    int? progress,
  }) {
    var notificationlId = manualUploadNotificationID;
    var androidChannelID = manualUploadChannelID;
    var androidChannelName = manualUploadChannelName;
    // Separate Notification for Info/Alerts and Progress
    if (isDetailed != null && isDetailed) {
      notificationlId = manualUploadDetailedNotificationID;
      androidChannelID = manualUploadDetailedChannelID;
      androidChannelName = manualUploadChannelNameDetailed;
    }
    // Progress notification
    final androidNotificationDetails = (maxProgress != null && progress != null)
        ? AndroidNotificationDetails(
            androidChannelID,
            androidChannelName,
            ticker: title,
            showProgress: true,
            onlyAlertOnce: true,
            maxProgress: maxProgress,
            progress: progress,
            indeterminate: false,
            playSound: false,
            priority: Priority.low,
            importance: Importance.low,
            ongoing: true,
            actions: (showActions ?? false)
                ? <AndroidNotificationAction>[
                    const AndroidNotificationAction(
                      cancelUploadActionID,
                      'Cancel',
                      showsUserInterface: true,
                    ),
                  ]
                : null,
          )
        // Non-progress notification
        : AndroidNotificationDetails(
            androidChannelID,
            androidChannelName,
            playSound: false,
          );

    final iosNotificationDetails = DarwinNotificationDetails(
      presentBadge: true,
      presentList: true,
      presentBanner: presentBanner,
    );

    return _showOrUpdateNotification(
      notificationlId,
      title,
      body,
      androidNotificationDetails,
      iosNotificationDetails,
    );
  }

  void _onDidReceiveForegroundNotificationResponse(
    NotificationResponse notificationResponse,
  ) {
    // Handle notification actions
    switch (notificationResponse.actionId) {
      case cancelUploadActionID:
        {
          debugPrint("User cancelled manual upload operation");
          ref.read(manualUploadProvider.notifier).cancelBackup();
        }
    }
  }
}
