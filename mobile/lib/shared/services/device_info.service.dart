import 'package:flutter_udid/flutter_udid.dart';
import 'dart:io' show Platform;
import 'package:platform_device_id/platform_device_id.dart';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:openapi/api.dart';

final deviceInfoServiceProvider = Provider((_) => DeviceInfoService());

class DeviceInfoService {
  Future<Map<String, dynamic>> getDeviceInfo() async {
    // Get device info
    final String deviceId;
    final DeviceTypeEnum deviceType;

    if (Platform.isAndroid) {
      deviceId = await FlutterUdid.consistentUdid;
      deviceType = DeviceTypeEnum.ANDROID;
    } else if (Platform.isIOS) {
      deviceId = await FlutterUdid.consistentUdid;
      deviceType = DeviceTypeEnum.IOS;
    } else if (Platform.isLinux) {
      deviceId = 'linux123';
      deviceType = DeviceTypeEnum.LINUX;
    } else {
      throw UnsupportedError('Platform not supported');
    }

    return {"deviceId": deviceId, "deviceType": deviceType};
  }
}
