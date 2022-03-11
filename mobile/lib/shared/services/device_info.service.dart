import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_udid/flutter_udid.dart';
import 'package:flutter/material.dart';

class DeviceInfoService {
  Future<Map<String, dynamic>> getDeviceInfo() async {
    // Get device info
    DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    String? deviceId = "";
    String deviceType = "";

    try {
      deviceId = await FlutterUdid.consistentUdid;
      deviceType = "ANDROID";
    } catch (e) {
      debugPrint("Not an android device");
    }

    try {
      deviceId = await FlutterUdid.consistentUdid;
      deviceType = "IOS";
      debugPrint("Device ID: $deviceId");
    } catch (e) {
      debugPrint("Not an ios device");
    }

    return {"deviceId": deviceId, "deviceType": deviceType};
  }
}
