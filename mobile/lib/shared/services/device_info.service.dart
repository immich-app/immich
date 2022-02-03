import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';

class DeviceInfoService {
  Future<Map<String, dynamic>> getDeviceInfo() async {
    // Get device info
    DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    String? deviceId = "";
    String deviceType = "";

    try {
      AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      deviceId = androidInfo.androidId;
      deviceType = "ANDROID";
    } catch (e) {
      debugPrint("Not an android device");
    }

    try {
      IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
      deviceId = iosInfo.identifierForVendor;
      deviceType = "IOS";
      debugPrint("Device ID: $deviceId");
    } catch (e) {
      debugPrint("Not an ios device");
    }

    return {"deviceId": deviceId, "deviceType": deviceType};
  }
}
