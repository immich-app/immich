import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

final permissionRepositoryProvider = Provider((_) {
  return PermissionRepository();
});

class PermissionRepository implements IPermissionRepository {
  PermissionRepository();

  @override
  Future<bool> hasLocationWhenInUsePermission() {
    return Permission.locationWhenInUse.isGranted;
  }

  @override
  Future<bool> requestLocationWhenInUsePermission() async {
    final result = await Permission.locationWhenInUse.request();
    return result.isGranted;
  }

  @override
  Future<bool> hasLocationAlwaysPermission() {
    return Permission.locationAlways.isGranted;
  }

  @override
  Future<bool> requestLocationAlwaysPermission() async {
    final result = await Permission.locationAlways.request();
    return result.isGranted;
  }

  @override
  Future<bool> openSettings() {
    return openAppSettings();
  }
}

abstract interface class IPermissionRepository {
  Future<bool> hasLocationWhenInUsePermission();
  Future<bool> requestLocationWhenInUsePermission();
  Future<bool> hasLocationAlwaysPermission();
  Future<bool> requestLocationAlwaysPermission();
  Future<bool> openSettings();
}
