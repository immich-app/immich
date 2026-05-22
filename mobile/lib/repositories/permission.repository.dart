import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/permission_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:permission_handler/permission_handler.dart';

final permissionRepositoryProvider = Provider((ref) {
  return PermissionRepository(ref.watch(permissionApiProvider));
});

class PermissionRepository implements IPermissionRepository {
  final PermissionApi _permissionApi;

  const PermissionRepository(this._permissionApi);

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

  @override
  Future<bool> hasManageMediaPermission() {
    return _permissionApi.hasManageMediaPermission();
  }

  @override
  Future<bool> requestManageMediaPermission() {
    return _permissionApi.requestManageMediaPermission();
  }

  @override
  Future<bool> manageMediaPermission() {
    return _permissionApi.manageMediaPermission();
  }
}

abstract interface class IPermissionRepository {
  Future<bool> hasLocationWhenInUsePermission();
  Future<bool> requestLocationWhenInUsePermission();
  Future<bool> hasLocationAlwaysPermission();
  Future<bool> requestLocationAlwaysPermission();
  Future<bool> openSettings();
  Future<bool> hasManageMediaPermission();
  Future<bool> requestManageMediaPermission();
  Future<bool> manageMediaPermission();
}
