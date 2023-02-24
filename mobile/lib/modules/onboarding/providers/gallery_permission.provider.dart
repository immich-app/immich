import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

class GalleryPermissionNotifier extends StateNotifier<PermissionStatus> {
  GalleryPermissionNotifier() :
    super(PermissionStatus.denied,
  ) {
    // Sets the initial state
    getGalleryPermission().then((p) => state = p);
  }

  bool get hasPermission => state.isGranted || state.isLimited;

  /// Requests the gallery permission
  Future<PermissionStatus> requestGalleryPermission() async {
     final permission = await Permission.photos.request();
     state = permission;
     return permission;
  }

  Future<PermissionStatus> getGalleryPermission() async {
    final status = await Permission.photos.status;

    state = status;
    return status;
  }

  /// Either the permission was granted already or else ask for the permission
  Future<bool> hasOrAskForNotificationPermission() {
    return requestGalleryPermission()
        .then((p) => p.isGranted);
  }

}
final galleryPermissionNotifier
  = StateNotifierProvider<GalleryPermissionNotifier, PermissionStatus>
    ((ref) => GalleryPermissionNotifier());
