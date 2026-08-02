import 'package:drift/drift.dart';

// Synced dates can fall outside the year range sqlite date functions handle
// (1..9999), which turns bucket queries into NULLs and crashes the timeline
// (#28524). Clamps every stored datetime into the representable range; anything
// in range passes through untouched.
final class DateTimeClampConverter extends TypeConverter<DateTime, DateTime> {
  const DateTimeClampConverter();

  // utc so drift's text mapping never formats these with a historical local
  // offset (those carry seconds, which drift refuses to store). the ceiling
  // stays at midnight: a later time would overflow sqlite's year range again
  // when a query applies 'localtime' east of UTC
  static final DateTime _floor = DateTime.utc(1);
  static final DateTime _ceiling = DateTime.utc(9999, 12, 31);

  @override
  DateTime fromSql(DateTime fromDb) => _clamp(fromDb);

  @override
  DateTime toSql(DateTime value) => _clamp(value);

  static DateTime _clamp(DateTime value) {
    if (value.isBefore(_floor)) {
      return _floor;
    }
    if (value.isAfter(_ceiling)) {
      return _ceiling;
    }
    return value;
  }
}
