import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/utils/datetime_clamp.type.dart';

void main() {
  const options = DriftDatabaseOptions(storeDateTimeAsText: true);
  final types = options.createTypeMapping(SqlDialect.sqlite);
  final ctx = GenerationContext(options, null);
  DateTime toSql(DateTime value) => types.read(DriftSqlType.dateTime, clampedDateTime.mapToSqlParameter(ctx, value))!;

  test('clamps far-future years to the ceiling on write', () {
    // the reporter's date from #28524
    final poison = DateTime.utc(144769, 11, 18, 12, 38, 32);
    final ceiling = DateTime.utc(9999, 12, 31);
    expect(toSql(poison), ceiling);
    expect(toSql(DateTime(144769, 1, 1)), ceiling); // local poison normalizes to utc
  });

  test('clamps BCE and year zero to the floor on write', () {
    final floor = DateTime.utc(1, 1, 1);
    expect(toSql(DateTime.utc(-4712, 3, 4, 5, 6, 7)), floor);
    expect(toSql(DateTime.utc(0, 12, 31)), floor);
  });

  test('keeps in-range years untouched, but clamps the last hours of 9999-12-31', () {
    // the range-exact lesson: in-range values never change, even near the edges
    final low = DateTime.utc(1, 1, 1);
    final justBefore = DateTime.utc(9999, 12, 30, 23, 59, 59);
    final normal = DateTime.utc(2024, 1, 2, 3, 4, 5, 123);
    expect(toSql(low), low);
    expect(toSql(justBefore), justBefore);
    expect(toSql(normal), normal);
    // local datetimes keep their zone flag
    final local = DateTime(2024, 6, 15, 10, 30, 25);
    expect(toSql(local), local);
    expect(toSql(local).isUtc, isFalse);
  });

  test('clamps the late hours of 9999-12-31 to the midnight ceiling', () {
    // legal upstream (year 9999 passes the server's rule), but east of UTC the
    // bucket query's 'localtime' overflows sqlite's year range on it -> NULL
    final ceiling = DateTime.utc(9999, 12, 31);
    expect(toSql(DateTime.utc(9999, 12, 31, 23, 59, 59)), ceiling);
    expect(toSql(DateTime(9999, 12, 31, 23, 59, 59)), ceiling); // local normalizes to utc
  });

  test('reads pass stored values through untouched', () {
    // writes clamp and the v32 migration heals the backlog, so reads never clamp
    final stored = types.mapToSqlVariable(DateTime.utc(2024, 1, 2, 3, 4, 5, 123))!;
    expect(clampedDateTime.read(types, stored), DateTime.utc(2024, 1, 2, 3, 4, 5, 123));
  });
}
