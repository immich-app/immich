import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';

class GalleryPermissionNotifier extends StateNotifier<PermissionStatus> {
  GalleryPermissionNotifier()
      : super(PermissionStatus.denied) // Denied is the intitial state
  {
    // Sets the initial state
    getGalleryPermissionStatus();
  }

  get hasPermission => state.isGranted || state.isLimited;

  /// Requests the gallery permission
  Future<PermissionStatus> requestGalleryPermission() async {
    PermissionStatus result;
    // Android 32 and below uses Permission.storage
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      if (androidInfo.version.sdkInt <= 32) {
        // Android 32 and below need storage
        final permission = await Permission.storage.request();
        result = permission;
      } else {
        // Android 33 need photo & video
        final photos = await Permission.photos.request();
        if (!photos.isGranted) {
          // Don't ask twice for the same permission
          state = photos;
          return photos;
        }
        final videos = await Permission.videos.request();

        // Return the joint result of those two permissions
        final PermissionStatus status;
        if (photos.isGranted && videos.isGranted) {
          status = PermissionStatus.granted;
        } else if (photos.isDenied || videos.isDenied) {
          status = PermissionStatus.denied;
        } else if (photos.isPermanentlyDenied || videos.isPermanentlyDenied) {
          status = PermissionStatus.permanentlyDenied;
        } else {
          status = PermissionStatus.denied;
        }

        result = status;
      }
      if (result == PermissionStatus.granted &&
          androidInfo.version.sdkInt >= 29) {
        result = await Permission.accessMediaLocation.request();
      }
    } else {
      // iOS can use photos
      final photos = await Permission.photos.request();
      result = photos;
    }
    state = result;
    return result;
  }

  /// Checks the current state of the gallery permissions without
  /// requesting them again
  Future<PermissionStatus> getGalleryPermissionStatus() async {
    PermissionStatus result;
    // Android 32 and below uses Permission.storage
    if (Platform.isAndroid) {
      final androidInfo = await DeviceInfoPlugin().androidInfo;
      if (androidInfo.version.sdkInt <= 32) {
        // Android 32 and below need storage
        final permission = await Permission.storage.status;
        result = permission;
      } else {
        // Android 33 needs photo & video
        final photos = await Permission.photos.status;
        final videos = await Permission.videos.status;

        // Return the joint result of those two permissions
        final PermissionStatus status;
        if (photos.isGranted && videos.isGranted) {
          status = PermissionStatus.granted;
        } else if (photos.isDenied || videos.isDenied) {
          status = PermissionStatus.denied;
        } else if (photos.isPermanentlyDenied || videos.isPermanentlyDenied) {
          status = PermissionStatus.permanentlyDenied;
        } else {
          status = PermissionStatus.denied;
        }

        result = status;
      }
      if (state == PermissionStatus.granted &&
          androidInfo.version.sdkInt >= 29) {
        result = await Permission.accessMediaLocation.status;
      }
    } else {
      // iOS can use photos
      final photos = await Permission.photos.status;
      result = photos;
    }
    state = result;
    return result;
  }
}

final galleryPermissionNotifier =
    StateNotifierProvider<GalleryPermissionNotifier, PermissionStatus>(
  (ref) => GalleryPermissionNotifier(),
);
