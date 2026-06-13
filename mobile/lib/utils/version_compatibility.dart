import 'package:immich_mobile/utils/semver.dart';

String? getVersionCompatibilityMessage(SemVer serverVersion, SemVer appVersion) {
  // Add latest compat info up top

  // ensure mobile app major version is not behind server major version
  if (appVersion.major < serverVersion.major) {
    return 'Your mobile app version is not compatible with the server! Please update your mobile app to the latest version.';
  }

  // ensure mobile app major version is not ahead of server major version by more than 1 major version
  if (appVersion.major > serverVersion.major + 1) {
    return 'Your server version is not compatible with the mobile app! Please update your server to the latest version.';
  }

  const v1_106_0 = SemVer(major: 1, minor: 106, patch: 0);
  if (serverVersion < v1_106_0 && appVersion > v1_106_0) {
    return 'Your mobile app is not compatible with the server! Please update your server to version v1.106.0 or newer to login';
  }

  return null;
}
