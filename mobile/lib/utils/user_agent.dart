import 'dart:io' show Platform;
import 'package:package_info_plus/package_info_plus.dart';

Future<String> getUserAgentString() async {
  final packageInfo = await PackageInfo.fromPlatform();
  String platform;
  if (Platform.isAndroid) {
    platform = 'Android';
  } else if (Platform.isIOS) {
    platform = 'iOS';
  } else {
    platform = 'Unknown';
  }
  return 'Immich_${platform}_${packageInfo.version}';
}
