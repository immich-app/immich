import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';

typedef _Handler = Future<DevicePermissionStatus> Function(DevicePermission);

class DevicePermissionService {
  const DevicePermissionService(this._permissionRepository);

  final DevicePermissionRepository _permissionRepository;

  Future<DevicePermissionStatus> galleryStatus() => _gallery(_permissionRepository.getStatus);

  Future<DevicePermissionStatus> requestGallery() => _gallery(_permissionRepository.request);

  Future<DevicePermissionStatus> _gallery(_Handler handler) async {
    if (CurrentPlatform.isIOS) {
      return handler(.photos);
    }

    final sdkVersion = await _permissionRepository.getAndroidSdkVersion();
    const maxExternalStorageSdk = 32; // READ/WRITE_EXTERNAL_STORAGE - Android 12.1
    final status = sdkVersion <= maxExternalStorageSdk ? await handler(.storage) : await _photosAndVideos(handler);

    const minMediaLocationSdk = 29; // ACCESS_MEDIA_LOCATION - Android 10
    if (status.hasAccess && sdkVersion >= minMediaLocationSdk) {
      final mediaLocation = await handler(.mediaLocation);
      return mediaLocation.hasAccess ? status : mediaLocation;
    }

    return status;
  }

  Future<DevicePermissionStatus> _photosAndVideos(_Handler handler) async {
    final photos = await handler(.photos);
    if (!photos.hasAccess) {
      return photos;
    }

    final videos = await handler(.videos);
    if (!videos.hasAccess) {
      return videos;
    }

    return photos == .granted && videos == .granted ? .granted : .limited;
  }
}
