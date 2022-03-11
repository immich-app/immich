import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_udid/flutter_udid.dart';
import 'dart:io' show Platform;

class DeviceInfoService {
  Future<Map<String, dynamic>> getDeviceInfo() async {
    // Get device info
    DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    String deviceId = await FlutterUdid.consistentUdid;
    String deviceType = "";

    if (Platform.isAndroid) {
      deviceType = "ANDROID";
    } else if (Platform.isIOS) {
      deviceType = "IOS";
    }

    return {"deviceId": deviceId, "deviceType": deviceType};
  }
}
