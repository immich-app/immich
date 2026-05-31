import 'package:immich_dart_openapi_generator/src/ir/types.dart';
import 'package:immich_dart_openapi_generator/src/util/naming.dart';
import 'package:immich_dart_openapi_generator/src/util/version.dart';
import 'package:test/test.dart';

void main() {
  group('parseSpecVersion', () {
    test('bare major normalizes to x.0.0 (would throw in app SemVer.fromString)', () {
      expect(parseSpecVersion('v1'), const SemVerLit(1, 0, 0));
      expect(parseSpecVersion('v2'), const SemVerLit(2, 0, 0));
    });

    test('full versions, with and without leading v', () {
      expect(parseSpecVersion('v2.6.0'), const SemVerLit(2, 6, 0));
      expect(parseSpecVersion('2.5.0'), const SemVerLit(2, 5, 0));
      expect(parseSpecVersion('v1.113.0'), const SemVerLit(1, 113, 0));
    });

    test('pre-release/build suffix is dropped', () {
      expect(parseSpecVersion('2.6.0-rc.1'), const SemVerLit(2, 6, 0));
    });

    test('unparseable returns null', () {
      expect(parseSpecVersion('latest'), isNull);
      expect(parseSpecVersion(''), isNull);
    });
  });

  group('buildVersionMeta from x-immich-history', () {
    test('derives addedIn, deprecatedIn, current state, and history', () {
      final meta = buildVersionMeta(
        [
          {'version': 'v1', 'state': 'Added'},
          {'version': 'v1.113.0', 'state': 'Deprecated', 'description': 'use thumbnail'},
        ],
        'Deprecated',
      );
      expect(meta, isNotNull);
      expect(meta!.addedIn, const SemVerLit(1, 0, 0));
      expect(meta.deprecatedIn, const SemVerLit(1, 113, 0));
      expect(meta.state, LifecycleState.deprecated);
      expect(meta.history, hasLength(2));
      expect(meta.history.last.description, 'use thumbnail');
    });

    test('falls back to last history state when x-immich-state absent', () {
      final meta = buildVersionMeta(
        [
          {'version': 'v2.5.0', 'state': 'Added'},
          {'version': 'v2.5.0', 'state': 'Beta'},
        ],
        null,
      );
      expect(meta!.state, LifecycleState.beta);
      expect(meta.deprecatedIn, isNull);
    });

    test('nothing annotated returns null', () {
      expect(buildVersionMeta(null, null), isNull);
    });
  });

  group('enum member sanitization (always lowerCamelCase)', () {
    test('lowercases single-word values incl. all-caps (no all-caps exception)', () {
      expect(sanitizeEnumMember('IMAGE'), 'image');
      expect(sanitizeEnumMember('timeline'), 'timeline');
    });

    test('camelCases PascalCase, dotted, hyphenated, underscored values', () {
      expect(sanitizeEnumMember('AssetDelete'), 'assetDelete');
      expect(sanitizeEnumMember('activity.create'), 'activityCreate');
      expect(sanitizeEnumMember('refresh-faces'), 'refreshFaces');
      expect(sanitizeEnumMember('on_this_day'), 'onThisDay');
    });

    test('no common-prefix stripping (unlike openapi-generator)', () {
      expect(sanitizeEnumMember('client_secret_post'), 'clientSecretPost');
      expect(sanitizeEnumMember('client_secret_basic'), 'clientSecretBasic');
    });

    test('escapes reserved words and leading digits', () {
      expect(sanitizeEnumMember('default'), r'default$');
      expect(sanitizeEnumMember('2fa'), 'n2fa');
    });
  });

  group('casing helpers', () {
    test('PascalCase from snake/kebab', () {
      expect(toPascalCase('asset_response_dto'), 'AssetResponseDto');
      expect(toPascalCase('shared-link'), 'SharedLink');
    });

    test('camelCase keeps reserved escaping', () {
      expect(toCamelCase('in'), r'in$');
    });

    test('snake_case file stems', () {
      expect(toSnakeCase('AssetResponseDto'), 'asset_response_dto');
    });
  });
}
