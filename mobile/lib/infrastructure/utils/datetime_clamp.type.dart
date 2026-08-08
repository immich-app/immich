import 'package:drift/drift.dart';

// Synced dates can fall outside the year range sqlite date functions handle
// (1..9999), which turns bucket queries into NULLs and crashes the timeline
// (#28524). Clamps on write; the v32 heal migration rewrites the backlog.
const clampedDateTime = DateTimeClampType();

final class DateTimeClampType implements DialectAwareSqlType<DateTime> {
  const DateTimeClampType();

  @override
  DateTime read(SqlTypes types, Object fromSql) => types.read(DriftSqlType.dateTime, fromSql)!;

  @override
  Object mapToSqlParameter(GenerationContext context, DateTime value) =>
      context.typeMapping.mapToSqlVariable(_clampDateTime(value))!;

  @override
  String mapToSqlLiteral(GenerationContext context, DateTime value) =>
      context.typeMapping.mapToSqlLiteral(_clampDateTime(value));

  @override
  String sqlTypeName(GenerationContext context) => DriftSqlType.dateTime.sqlTypeName(context);
}

// utc so drift's text mapping never formats these with a historical local
// offset (those carry seconds, which drift refuses to store). the ceiling
// stays at midnight: a later time would overflow sqlite's year range again
// when a query applies 'localtime' east of UTC
final DateTime _floor = DateTime.utc(1);
final DateTime _ceiling = DateTime.utc(9999, 12, 31);

DateTime _clampDateTime(DateTime value) {
  if (value.isBefore(_floor)) {
    return _floor;
  }
  if (value.isAfter(_ceiling)) {
    return _ceiling;
  }
  return value;
}
