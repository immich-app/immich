import 'package:immich_mobile/utils/semver.dart';

String? getVersionCompatibilityMessage(SemVer serverVersion, SemVer appVersion) {
  // Add latest compat info up top
  const v1_106_0 = SemVer(major: 1, minor: 106, patch: 0);
  if (serverVersion < v1_106_0 && appVersion > v1_106_0) {
    return 'Your app minor version is not compatible with the server! Please update your server to version v1.106.0 or newer to login';
  }

  return null;
}
