import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/services/device_permission.service.dart';
import 'package:immich_mobile/repositories/permission.repository.dart';

final galleryPermissionServiceProvider = Provider((ref) {
  return DevicePermissionService(ref.watch(permissionRepositoryProvider));
});

class GalleryPermissionNotifier extends StateNotifier<DevicePermissionStatus> {
  GalleryPermissionNotifier(this._service) : super(.denied) {
    unawaited(getGalleryPermissionStatus());
  }

  final DevicePermissionService _service;

  bool get hasPermission => state.hasAccess;

  Future<DevicePermissionStatus> requestGalleryPermission() async => state = await _service.requestGallery();

  Future<DevicePermissionStatus> getGalleryPermissionStatus() async => state = await _service.galleryStatus();
}

final galleryPermissionNotifier = StateNotifierProvider<GalleryPermissionNotifier, DevicePermissionStatus>(
  (ref) => GalleryPermissionNotifier(ref.watch(galleryPermissionServiceProvider)),
);
