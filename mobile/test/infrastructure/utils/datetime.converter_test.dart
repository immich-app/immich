import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/infrastructure/utils/datetime.converter.dart';

void main() {
  const converter = DateTimeClampConverter();

  test('clamps far-future years to the ceiling in both directions', () {
    // the reporter's date from #28524
    final poison = DateTime.utc(144769, 11, 18, 12, 38, 32);
    final ceiling = DateTime.utc(9999, 12, 31);
    expect(converter.toSql(poison), ceiling);
    expect(converter.fromSql(poison), ceiling);
    expect(converter.toSql(DateTime(144769, 1, 1)), ceiling); // local poison normalizes to utc
  });

  test('clamps BCE and year zero to the floor in both directions', () {
    final floor = DateTime.utc(1, 1, 1);
    expect(converter.toSql(DateTime.utc(-4712, 3, 4, 5, 6, 7)), floor);
    expect(converter.fromSql(DateTime.utc(-4712, 3, 4, 5, 6, 7)), floor);
    expect(converter.toSql(DateTime.utc(0, 12, 31)), floor);
  });

  test('keeps in-range years untouched, but clamps the last hours of 9999-12-31', () {
    // the range-exact lesson: in-range values never change, even near the edges
    final low = DateTime.utc(1, 1, 1);
    final justBefore = DateTime.utc(9999, 12, 30, 23, 59, 59);
    final normal = DateTime.utc(2024, 1, 2, 3, 4, 5, 123);
    expect(converter.toSql(low), low);
    expect(converter.fromSql(low), low);
    expect(converter.toSql(justBefore), justBefore);
    expect(converter.toSql(normal), normal);
    expect(converter.fromSql(normal), normal);
    // local datetimes keep their zone flag
    final local = DateTime(2024, 6, 15, 10, 30, 25);
    expect(converter.toSql(local), local);
    expect(converter.toSql(local).isUtc, isFalse);
  });

  test('clamps the late hours of 9999-12-31 to the midnight ceiling', () {
    // legal upstream (year 9999 passes the server's rule), but east of UTC the
    // bucket query's 'localtime' overflows sqlite's year range on it -> NULL
    final ceiling = DateTime.utc(9999, 12, 31);
    expect(converter.toSql(DateTime.utc(9999, 12, 31, 23, 59, 59)), ceiling);
    expect(converter.fromSql(DateTime.utc(9999, 12, 31, 23, 59, 59)), ceiling);
    expect(converter.toSql(DateTime(9999, 12, 31, 23, 59, 59)), ceiling); // local normalizes to utc
  });

  group('every datetime column carries the clamp converter', () {
    int expectClampConverter(GeneratedDatabase db) {
      final poison = DateTime.utc(144769, 11, 18, 12, 38, 32);
      var count = 0;
      for (final table in db.allTables) {
        for (final column in table.$columns) {
          if (column.type != DriftSqlType.dateTime) {
            continue;
          }
          count++;
          // nullable columns wrap the same converter in drift's NullAwareTypeConverter
          expect(
            column,
            isA<GeneratedColumnWithTypeConverter<dynamic, DateTime>>(),
            reason: '${table.entityName}.${column.$name} is missing the clamp converter',
          );
          final converter = (column as GeneratedColumnWithTypeConverter<dynamic, DateTime>).converter;
          expect(
            converter.toSql(poison),
            DateTime.utc(9999, 12, 31),
            reason: '${table.entityName}.${column.$name} is missing the clamp converter',
          );
        }
      }
      return count;
    }

    test('main database: all 32 columns across all tables', () {
      final db = Drift(NativeDatabase.memory());
      addTearDown(db.close);
      expect(expectClampConverter(db), 32);
    });

    test('logs database: the log timestamp column', () {
      final logDb = DriftLogger.fromExecutor(NativeDatabase.memory());
      addTearDown(logDb.close);
      expect(expectClampConverter(logDb), 1);
    });
  });
}
