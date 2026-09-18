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

String timelineGroupDate(DateTime value) => DateFormat('yyyy-MM-dd', 'en_US').format(value);
