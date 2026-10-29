import 'package:immich_mobile/data/db/util/datetime_clamp_type.dart';
import 'package:intl/intl.dart';

DateTime? tryFromSecondsSinceEpoch(int? secondsSinceEpoch, {bool isUtc = false}) {
  if (secondsSinceEpoch == null) {
    return null;
  }

  final milliSeconds = secondsSinceEpoch * 1000;
  try {
    return DateTime.fromMillisecondsSinceEpoch(milliSeconds, isUtc: isUtc);
  } catch (e) {
    return null;
  }
}

final _groupDateFormat = DateFormat('yyyy-MM-dd', 'en_US');

// the columns store clamped dates, the group date has to name the same day
String timelineGroupDate(DateTime value) => _groupDateFormat.format(clampDateTime(value));
