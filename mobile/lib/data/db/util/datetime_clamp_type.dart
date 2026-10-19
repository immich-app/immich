import 'package:drift/drift.dart';

/// A `TEXT` column designed to store a `DateTime`. Clamps to the same range given by SQLite's `DateTime`, that is, years [1...10000)
const clampedDateTime = _DateTimeClampType();

final class _DateTimeClampType implements DialectAwareSqlType<DateTime> {
  const _DateTimeClampType();

  @override
  DateTime read(SqlTypes types, Object fromSql) => types.read(DriftSqlType.dateTime, fromSql)!;

  @override
  Object mapToSqlParameter(GenerationContext context, DateTime value) =>
      context.typeMapping.mapToSqlVariable(clampDateTime(value))!;

  @override
  String mapToSqlLiteral(GenerationContext context, DateTime value) =>
      context.typeMapping.mapToSqlLiteral(clampDateTime(value));

  @override
  String sqlTypeName(GenerationContext context) => DriftSqlType.dateTime.sqlTypeName(context);
}

// utc so drift's text mapping never formats these with a historical local
// offset (those carry seconds, which drift refuses to store). the ceiling
// stays at midnight: a later time would overflow sqlite's year range again
// when a query applies 'localtime' east of UTC
final DateTime _floor = DateTime.utc(1);
final DateTime _ceiling = DateTime.utc(9999, 12, 31);

DateTime clampDateTime(DateTime value) {
  if (value.isBefore(_floor)) {
    return _floor;
  }
  if (value.isAfter(_ceiling)) {
    return _ceiling;
  }
  return value;
}
