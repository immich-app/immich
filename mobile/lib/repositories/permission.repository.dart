import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

final permissionRepositoryProvider = Provider((_) {
  return PermissionRepository();
});

class PermissionRepository implements IPermissionRepository {
  PermissionRepository();

  @override
  Future<bool> hasWifiReadPermission() {
    return Permission.locationWhenInUse.isGranted;
  }

  @override
  Future<bool> requestWifiReadPermission() async {
    final result = await Permission.locationWhenInUse.request();
    return result.isGranted;
  }
}

abstract interface class IPermissionRepository {
  Future<bool> hasWifiReadPermission();
  Future<bool> requestWifiReadPermission();
}
