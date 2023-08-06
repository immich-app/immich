import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final localNotificationService = Provider((ref) => LocalNotificationService());

class LocalNotificationService {
  static final LocalNotificationService _instance =
      LocalNotificationService._internal();
  final FlutterLocalNotificationsPlugin _localNotificationPlugin =
      FlutterLocalNotificationsPlugin();

  static const manualUploadNotificationID = 4;
  static const manualUploadDetailedNotificationID = 5;
  static const manualUploadChannelName = 'Manual Asset Upload';
  static const manualUploadChannelID = 'immich/manualUpload';
  static const manualUploadChannelNameDetailed = 'Manual Asset Upload Detailed';
  static const manualUploadDetailedChannelID = 'immich/manualUploadDetailed';

  factory LocalNotificationService() => _instance;
  LocalNotificationService._internal();

  Future<void> setup() async {
    const androidSetting = AndroidInitializationSettings('notification_icon');
    const iosSetting = DarwinInitializationSettings();

    const initSettings =
        InitializationSettings(android: androidSetting, iOS: iosSetting);

    await _localNotificationPlugin.initialize(initSettings);
  }

  Future<void> _showOrUpdateNotification(
    int id,
    String channelId,
    String channelName,
    String title,
    String body, {
    bool? ongoing,
    bool? playSound,
    bool? showProgress,
    Priority? priority,
    Importance? importance,
    bool? onlyAlertOnce,
    int? maxProgress,
    int? progress,
    bool? indeterminate,
    bool? presentBadge,
    bool? presentBanner,
    bool? presentList,
  }) async {
    var androidNotificationDetails = AndroidNotificationDetails(
      channelId,
      channelName,
      ticker: title,
      playSound: playSound ?? false,
      showProgress: showProgress ?? false,
      maxProgress: maxProgress ?? 0,
      progress: progress ?? 0,
      onlyAlertOnce: onlyAlertOnce ?? false,
      indeterminate: indeterminate ?? false,
      priority: priority ?? Priority.defaultPriority,
      importance: importance ?? Importance.defaultImportance,
      ongoing: ongoing ?? false,
    );

    var iosNotificationDetails = DarwinNotificationDetails(
      presentBadge: presentBadge ?? false,
      presentBanner: presentBanner ?? false,
      presentList: presentList ?? false,
      
    );

    final notificationDetails = NotificationDetails(
      android: androidNotificationDetails,
      iOS: iosNotificationDetails,
    );

    await _localNotificationPlugin.show(id, title, body, notificationDetails);
  }

  Future<void> closeNotification(int id) {
    return _localNotificationPlugin.cancel(id);
  }

  Future<void> showOrUpdateManualUploadStatus(
    String title,
    String body, {
    bool? isDetailed,
    bool? presentBanner,
    int? maxProgress,
    int? progress,
  }) {
    var notificationlId = manualUploadNotificationID;
    var channelId = manualUploadChannelID;
    var channelName = manualUploadChannelName;
    // Separate Notification for Info/Alerts and Progress
    if (isDetailed != null && isDetailed) {
      notificationlId = manualUploadDetailedNotificationID;
      channelId = manualUploadDetailedChannelID;
      channelName = manualUploadChannelNameDetailed;
    }
    final isProgressNotification = maxProgress != null && progress != null;
    return isProgressNotification
        ? _showOrUpdateNotification(
            notificationlId,
            channelId,
            channelName,
            title,
            body,
            showProgress: true,
            onlyAlertOnce: true,
            maxProgress: maxProgress,
            progress: progress,
            indeterminate: false,
            presentList: true,
            priority: Priority.low,
            importance: Importance.low,
            presentBadge: true,
            ongoing: true,
          )
        : _showOrUpdateNotification(
            notificationlId,
            channelId,
            channelName,
            title,
            body,
            presentList: true,
            presentBadge: true,
            presentBanner: presentBanner,
          );
  }
}
