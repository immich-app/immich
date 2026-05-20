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

    test('Compares equal versons correctly', () {
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
  });
}
