import 'package:immich_dart_openapi_generator/src/emit/serialization.dart';
import 'package:immich_dart_openapi_generator/src/ir/types.dart';
import 'package:test/test.dart';

void main() {
  group('readExpr — required, non-null', () {
    test('primitives read as a direct cast, no `(as T?)!` noise', () {
      expect(readExpr(PrimitiveType(PrimitiveKind.string), 'j', nullable: false), 'j as String');
      expect(readExpr(PrimitiveType(PrimitiveKind.integer), 'j', nullable: false), 'j as int');
      expect(readExpr(PrimitiveType(PrimitiveKind.boolean), 'j', nullable: false), 'j as bool');
    });

    test('double coerces through num', () {
      expect(readExpr(PrimitiveType(PrimitiveKind.float), 'j', nullable: false), '(j as num).toDouble()');
    });

    test('dateTime parses', () {
      expect(
        readExpr(PrimitiveType(PrimitiveKind.dateTime), 'j', nullable: false),
        'DateTime.parse(j as String)',
      );
    });

    test('refs force-unwrap their nullable fromJson', () {
      final ref = RefType('Foo', dartName: 'Foo');
      expect(readExpr(ref, 'j', nullable: false), '(Foo.fromJson(j))!');
    });
  });

  group('readExpr — nullable', () {
    test('no redundant `?? null` for a nullable field', () {
      expect(readExpr(PrimitiveType(PrimitiveKind.string), 'j', nullable: true), '(j as String?)');
    });

    test('a NullDefault is treated as no default (still no `?? null`)', () {
      expect(
        readExpr(PrimitiveType(PrimitiveKind.string), 'j', nullable: true, def: const NullDefault()),
        '(j as String?)',
      );
    });
  });

  group('readExpr — real defaults', () {
    test('bool default appends `?? false`', () {
      expect(
        readExpr(PrimitiveType(PrimitiveKind.boolean), 'j', nullable: true, def: const BoolDefault(false)),
        '(j as bool?) ?? false',
      );
    });

    test('enum default references the const member, not fromJson(wire)!', () {
      final ref = RefType('AssetOrder', dartName: 'AssetOrder');
      final expr = readExpr(ref, 'j', nullable: true, def: EnumDefault(ref, 'desc'));
      expect(expr, 'AssetOrder.fromJson(j) ?? AssetOrder.desc');
    });
  });

  group('writeExpr', () {
    test('dateTime serializes as UTC ISO-8601', () {
      expect(
        writeExpr(PrimitiveType(PrimitiveKind.dateTime), 'x', nullable: false),
        'x.toUtc().toIso8601String()',
      );
    });

    test('nullable ref is null-aware', () {
      expect(writeExpr(RefType('Foo', dartName: 'Foo'), 'x', nullable: true), 'x?.toJson()');
    });
  });
}
