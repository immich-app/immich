// ignore_for_file: use-ref-and-state-synchronously

import 'dart:async';
import 'dart:io';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/permission_api.g.dart' as pm;
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationPermissionNotifier extends StateNotifier<PermissionStatus> {
  NotificationPermissionNotifier()
    : super(Platform.isAndroid ? PermissionStatus.granted : PermissionStatus.restricted) {
    // Sets the initial state
    unawaited(getNotificationPermission().then((p) => state = p));
  }

  /// Requests the notification permission
  /// Note: In Android, this is always granted
  Future<PermissionStatus> requestNotificationPermission() async {
    final permission = await Permission.notification.request();
    state = permission;
    return permission;
  }

  Future<PermissionStatus> getNotificationPermission() async {
    final status = await Permission.notification.status;
    state = status;
    return status;
  }
}

final notificationPermissionProvider = StateNotifierProvider<NotificationPermissionNotifier, PermissionStatus>(
  (ref) => NotificationPermissionNotifier(),
);

final batteryOptimizationProvider = AsyncNotifierProvider<BatteryOptimizationNotifier, PermissionStatus>(
  BatteryOptimizationNotifier.new,
);

class BatteryOptimizationNotifier extends AsyncNotifier<PermissionStatus> {
  Future<PermissionStatus> getBatteryOptimizationPermission() async {
    final isIgnoring = await ref.read(permissionApiProvider).isIgnoringBatteryOptimizations().then((p) => p.toStatus());
    state = AsyncValue.data(isIgnoring);
    return isIgnoring;
  }

  @override
  FutureOr<PermissionStatus> build() => getBatteryOptimizationPermission();
}

extension on pm.PermissionStatus {
  PermissionStatus toStatus() => switch (this) {
    pm.PermissionStatus.granted => PermissionStatus.granted,
    pm.PermissionStatus.denied => PermissionStatus.denied,
    pm.PermissionStatus.permanentlyDenied => PermissionStatus.permanentlyDenied,
  };
}
