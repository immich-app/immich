import 'package:device_info_plus/device_info_plus.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/platform/permission_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:permission_handler/permission_handler.dart' as ph;

final permissionRepositoryProvider = Provider((ref) {
  return DevicePermissionRepository(ref.watch(permissionApiProvider));
});

class DevicePermissionRepository {
  final PermissionApi _permissionApi;

  const DevicePermissionRepository(this._permissionApi);

  Future<DevicePermissionStatus> getStatus(DevicePermission permission) async =>
      (await permission.handler.status).toDevicePermissionStatus();

  Future<DevicePermissionStatus> request(DevicePermission permission) async =>
      (await permission.handler.request()).toDevicePermissionStatus();

  // TODO(shenlong): Move this to it's own device info repo
  Future<int> getAndroidSdkVersion() async {
    if (CurrentPlatform.isIOS) {
      throw UnsupportedError("This method is available only on Android");
    }

    final androidInfo = await DeviceInfoPlugin().androidInfo;
    return androidInfo.version.sdkInt;
  }

  Future<bool> hasLocationWhenInUsePermission() => ph.Permission.locationWhenInUse.isGranted;

  Future<bool> requestLocationWhenInUsePermission() async {
    final result = await ph.Permission.locationWhenInUse.request();
    return result.isGranted;
  }

  Future<bool> hasLocationAlwaysPermission() {
    return ph.Permission.locationAlways.isGranted;
  }

  Future<bool> requestLocationAlwaysPermission() async {
    final result = await ph.Permission.locationAlways.request();
    return result.isGranted;
  }

  Future<bool> openSettings() {
    return ph.openAppSettings();
  }

  Future<bool> hasManageMediaPermission() {
    return _permissionApi.hasManageMediaPermission();
  }

  Future<bool> requestManageMediaPermission() {
    return _permissionApi.requestManageMediaPermission();
  }

  Future<bool> manageMediaPermission() {
    return _permissionApi.manageMediaPermission();
  }
}

extension on DevicePermission {
  ph.Permission get handler => switch (this) {
    .photos => ph.Permission.photos,
    .videos => ph.Permission.videos,
    .storage => ph.Permission.storage,
    .mediaLocation => ph.Permission.accessMediaLocation,
  };
}

extension on ph.PermissionStatus {
  DevicePermissionStatus toDevicePermissionStatus() => switch (this) {
    .granted => .granted,
    .limited => .limited,
    .permanentlyDenied => .permanentlyDenied,
    _ => .denied,
  };
}
