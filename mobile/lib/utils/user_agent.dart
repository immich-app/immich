import 'dart:io' show Platform;
import 'package:immich_mobile/common/package_info.dart';

String getUserAgentString() {
  final packageInfo = PackageInfoSingleton.instance;
  String platform;
  if (Platform.isAndroid) {
    platform = 'Android';
  } else if (Platform.isIOS) {
    platform = 'iOS';
  } else {
    platform = 'Unknown';
  }
  final version = packageInfo.version ?? 'unknown';
  return 'Immich_${platform}_$version';
}
