import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

enum GalleryPermissionStatus {
  yetToRequest,
  granted,
  limited,
  denied,
  permanentlyDenied;

  bool get isGranted => this == GalleryPermissionStatus.granted;
  bool get isLimited => this == GalleryPermissionStatus.limited;
}

class GalleryPermissionNotifier extends ValueNotifier<GalleryPermissionStatus> {
  GalleryPermissionNotifier() : super(GalleryPermissionStatus.yetToRequest) {
    checkPermission();
  }

  bool get hasPermission => value.isGranted || value.isLimited;

  /// Requests the gallery permission
  Future<GalleryPermissionStatus> requestPermission() async {
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
          final state = _toGalleryPermissionStatus(photos);
          // Don't ask twice for the same permission
          value = state;
          return state;
        }

        final videos = await Permission.videos.request();
        // Return the joint result of those two permissions
        if ((photos.isGranted && videos.isGranted) ||
            (photos.isLimited && videos.isLimited)) {
          result = PermissionStatus.granted;
        } else if (photos.isDenied || videos.isDenied) {
          result = PermissionStatus.denied;
        } else if (photos.isPermanentlyDenied || videos.isPermanentlyDenied) {
          result = PermissionStatus.permanentlyDenied;
        } else {
          result = PermissionStatus.denied;
        }
      }
      if (result == PermissionStatus.granted &&
          androidInfo.version.sdkInt >= 29) {
        result = await Permission.accessMediaLocation.request();
      }
    } else {
      // iOS can use photos
      result = await Permission.photos.request();
    }
    value = _toGalleryPermissionStatus(result);
    return value;
  }

  /// Checks the current state of the gallery permissions without
  /// requesting them again
  Future<GalleryPermissionStatus> checkPermission() async {
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
        if ((photos.isGranted && videos.isGranted) ||
            (photos.isLimited && videos.isLimited)) {
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
        result = await Permission.accessMediaLocation.status;
      }
    } else {
      // iOS can use photos
      result = await Permission.photos.status;
    }
    value = _toGalleryPermissionStatus(result);
    return value;
  }
}

GalleryPermissionStatus _toGalleryPermissionStatus(PermissionStatus status) =>
    switch (status) {
      PermissionStatus.granted => GalleryPermissionStatus.granted,
      PermissionStatus.limited => GalleryPermissionStatus.limited,
      PermissionStatus.denied => GalleryPermissionStatus.denied,
      PermissionStatus.restricted ||
      PermissionStatus.permanentlyDenied ||
      PermissionStatus.provisional =>
        GalleryPermissionStatus.permanentlyDenied,
    };
