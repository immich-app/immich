import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:immich_mobile/utils/version_compatibility.dart';

void main() {
  test('getVersionCompatibilityMessage', () {
    String? result;

    // server older than 1.106.0, app newer -> incompatible
    result = getVersionCompatibilityMessage(
      const SemVer(major: 1, minor: 105, patch: 0),
      const SemVer(major: 1, minor: 107, patch: 0),
    );
    expect(
      result,
      'Your app minor version is not compatible with the server! Please update your server to version v1.106.0 or newer to login',
    );

    // server at 1.106.0 boundary -> compatible
    result = getVersionCompatibilityMessage(
      const SemVer(major: 1, minor: 106, patch: 0),
      const SemVer(major: 1, minor: 106, patch: 0),
    );
    expect(result, null);

    result = getVersionCompatibilityMessage(
      const SemVer(major: 1, minor: 106, patch: 0),
      const SemVer(major: 1, minor: 107, patch: 0),
    );
    expect(result, null);

    // server newer than app -> compatible
    result = getVersionCompatibilityMessage(
      const SemVer(major: 1, minor: 108, patch: 0),
      const SemVer(major: 1, minor: 107, patch: 0),
    );
    expect(result, null);
  });
}
