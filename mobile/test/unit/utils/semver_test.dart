import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/semver.dart';

void main() {
  group('SemVer', () {
    test('Parses valid semantic version strings correctly', () {
      final version = SemVer.fromString('1.2.3');
      expect(version.major, 1);
      expect(version.minor, 2);
      expect(version.patch, 3);
    });

    test('Throws FormatException for invalid version strings', () {
      expect(() => SemVer.fromString('1.2'), throwsFormatException);
      expect(() => SemVer.fromString('a.b.c'), throwsFormatException);
      expect(() => SemVer.fromString('1.2.3.4'), throwsFormatException);
    });

    test('Compares equal versions correctly', () {
      final v1 = SemVer.fromString('1.2.3');
      final v2 = SemVer.fromString('1.2.3');
      expect(v1 == v2, isTrue);
      expect(v1 > v2, isFalse);
      expect(v1 < v2, isFalse);
    });

    test('Compares major version correctly', () {
      final v1 = SemVer.fromString('2.0.0');
      final v2 = SemVer.fromString('1.9.9');
      expect(v1 == v2, isFalse);
      expect(v1 > v2, isTrue);
      expect(v1 < v2, isFalse);
    });

    test('Compares minor version correctly', () {
      final v1 = SemVer.fromString('1.3.0');
      final v2 = SemVer.fromString('1.2.9');
      expect(v1 == v2, isFalse);
      expect(v1 > v2, isTrue);
      expect(v1 < v2, isFalse);
    });

    test('Compares patch version correctly', () {
      final v1 = SemVer.fromString('1.2.4');
      final v2 = SemVer.fromString('1.2.3');
      expect(v1 == v2, isFalse);
      expect(v1 > v2, isTrue);
      expect(v1 < v2, isFalse);
    });

    test('Gives correct major difference type', () {
      final v1 = SemVer.fromString('2.0.0');
      final v2 = SemVer.fromString('1.9.9');
      expect(v1.differenceType(v2), SemVerType.major);
    });

    test('Gives correct minor difference type', () {
      final v1 = SemVer.fromString('1.3.0');
      final v2 = SemVer.fromString('1.2.9');
      expect(v1.differenceType(v2), SemVerType.minor);
    });

    test('Gives correct patch difference type', () {
      final v1 = SemVer.fromString('1.2.4');
      final v2 = SemVer.fromString('1.2.3');
      expect(v1.differenceType(v2), SemVerType.patch);
    });

    test('Gives null difference type for equal versions', () {
      final v1 = SemVer.fromString('1.2.3');
      final v2 = SemVer.fromString('1.2.3');
      expect(v1.differenceType(v2), isNull);
    });

    test('toString returns correct format', () {
      final version = SemVer.fromString('1.2.3');
      expect(version.toString(), '1.2.3');
    });

    test('Parses versions with leading v correctly', () {
      final version1 = SemVer.fromString('v1.2.3');
      expect(version1.major, 1);
      expect(version1.minor, 2);
      expect(version1.patch, 3);

      final version2 = SemVer.fromString('V1.2.3');
      expect(version2.major, 1);
      expect(version2.minor, 2);
      expect(version2.patch, 3);
    });

    test('Orders later prerelease above earlier prerelease', () {
      const rc1 = SemVer(major: 1, minor: 151, patch: 0, prerelease: 1);
      const rc2 = SemVer(major: 1, minor: 151, patch: 0, prerelease: 2);
      expect(rc2 > rc1, isTrue);
      expect(rc1 < rc2, isTrue);
      expect(rc1 == rc2, isFalse);
    });

    test('Final release outranks its prerelease of the same version', () {
      const rc = SemVer(major: 1, minor: 151, patch: 0, prerelease: 1);
      const release = SemVer(major: 1, minor: 151, patch: 0);
      expect(release > rc, isTrue);
      expect(rc < release, isTrue);
    });

    test('Higher major outranks a prerelease regardless of ordinal', () {
      const rc = SemVer(major: 1, minor: 151, patch: 0, prerelease: 9);
      const next = SemVer(major: 2, minor: 0, patch: 0);
      expect(next > rc, isTrue);
    });

    test('Equal prerelease versions compare as equal', () {
      const a = SemVer(major: 1, minor: 151, patch: 0, prerelease: 3);
      const b = SemVer(major: 1, minor: 151, patch: 0, prerelease: 3);
      expect(a == b, isTrue);
      expect(a > b, isFalse);
      expect(a < b, isFalse);
    });

    test('Reports prerelease difference type', () {
      const rc1 = SemVer(major: 1, minor: 151, patch: 0, prerelease: 1);
      const rc2 = SemVer(major: 1, minor: 151, patch: 0, prerelease: 2);
      expect(rc1.differenceType(rc2), SemVerType.prerelease);
    });

    test('toString includes prerelease suffix when present', () {
      const rc = SemVer(major: 1, minor: 151, patch: 0, prerelease: 2);
      expect(rc.toString(), '1.151.0-rc.2');
    });

    test('Parses prerelease ordinal from -rc strings', () {
      final dotted = SemVer.fromString('1.151.0-rc.2');
      expect(dotted.major, 1);
      expect(dotted.minor, 151);
      expect(dotted.patch, 0);
      expect(dotted.prerelease, 2);

      expect(SemVer.fromString('v1.151.0-rc.3').prerelease, 3);
      expect(SemVer.fromString('1.2.3-rc.2+build.5').prerelease, 2);
    });

    test('Plain version string has null prerelease', () {
      expect(SemVer.fromString('3.0.0').prerelease, isNull);
    });

    test('Invalid rc suffixes parse without error and have null prerelease', () {
      final debug = SemVer.fromString('1.2.3-debug');
      expect(debug.major, 1);
      expect(debug.minor, 2);
      expect(debug.patch, 3);
      expect(debug.prerelease, isNull);

      expect(SemVer.fromString('1.2.3+build.5').prerelease, isNull);
      expect(SemVer.fromString('1.151.0-rc4').prerelease, isNull);
    });
  });
}
