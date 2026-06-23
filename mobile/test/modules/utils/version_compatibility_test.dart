import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:immich_mobile/utils/version_compatibility.dart';

void main() {
  group('app major version behind server', () {
    const message =
        'Your mobile app version is not compatible with the server! Please update your mobile app to the latest version.';

    test('returns message when app major is behind server major', () {
      final result = getVersionCompatibilityMessage(
        const SemVer(major: 2, minor: 0, patch: 0),
        const SemVer(major: 1, minor: 200, patch: 0),
      );
      expect(result, message);
    });

    test('returns null when app major matches server major', () {
      final result = getVersionCompatibilityMessage(
        const SemVer(major: 2, minor: 0, patch: 0),
        const SemVer(major: 2, minor: 0, patch: 0),
      );
      expect(result, null);
    });
  });

  group('app major version too far ahead of server', () {
    const message =
        'Your server version is not compatible with the mobile app! Please update your server to the latest version.';

    test('returns message when app major is more than one ahead of server', () {
      final result = getVersionCompatibilityMessage(
        const SemVer(major: 1, minor: 200, patch: 0),
        const SemVer(major: 3, minor: 0, patch: 0),
      );
      expect(result, message);
    });

    test('returns null when app major is exactly one ahead of server', () {
      final result = getVersionCompatibilityMessage(
        const SemVer(major: 1, minor: 200, patch: 0),
        const SemVer(major: 2, minor: 0, patch: 0),
      );
      expect(result, null);
    });
  });
}
