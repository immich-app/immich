import 'package:easy_localization/easy_localization.dart';

/// Builds a [DateFormat] for the active [Intl.defaultLocale] (set on app start),
/// falling back to `en_US` for the handful of supported locales that intl has no
/// date-formatting data for and would otherwise throw a `LocaleDataException` on.
///
/// [create] is a [DateFormat] constructor tear-off, e.g. `DateFormat.jm`.
DateFormat localizedDateFormat(DateFormat Function([String? locale]) create) {
  try {
    return create(Intl.defaultLocale);
  } on Exception {
    return create('en_US');
  }
}

extension TimeAgoExtension on DateTime {
  /// Displays the time difference of this [DateTime] object to the current time as a [String]
  String timeAgo({bool numericDates = true}) {
    final DateTime date = toLocal();
    final now = DateTime.now().toLocal();
    final difference = now.difference(date);

    if (difference.inSeconds < 5) {
      return 'Just now';
    } else if (difference.inSeconds < 60) {
      return '${difference.inSeconds} seconds ago';
    } else if (difference.inMinutes <= 1) {
      return numericDates ? '1 minute ago' : 'A minute ago';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} minutes ago';
    } else if (difference.inHours <= 1) {
      return numericDates ? '1 hour ago' : 'An hour ago';
    } else if (difference.inHours < 60) {
      return '${difference.inHours} hours ago';
    } else if (difference.inDays <= 1) {
      return numericDates ? '1 day ago' : 'Yesterday';
    } else if (difference.inDays < 6) {
      return '${difference.inDays} days ago';
    } else if ((difference.inDays / 7).ceil() <= 1) {
      return numericDates ? '1 week ago' : 'Last week';
    } else if ((difference.inDays / 7).ceil() < 4) {
      return '${(difference.inDays / 7).ceil()} weeks ago';
    } else if ((difference.inDays / 30).ceil() <= 1) {
      return numericDates ? '1 month ago' : 'Last month';
    } else if ((difference.inDays / 30).ceil() < 30) {
      return '${(difference.inDays / 30).ceil()} months ago';
    } else if ((difference.inDays / 365).ceil() <= 1) {
      return numericDates ? '1 year ago' : 'Last year';
    }
    return '${(difference.inDays / 365).floor()} years ago';
  }
}

extension TimeFormatting on DateTime {
  /// When [alwaysUse24HourFormat] is true, uses a 24-hour `HH:mm` format; otherwise uses the
  /// locale-aware 12-hour format (e.g. "1:30 PM").
  String formatTime({required bool alwaysUse24HourFormat}) =>
      localizedDateFormat(alwaysUse24HourFormat ? DateFormat.Hm : DateFormat.jm).format(this);
}

extension DateFormatting on DateTime {
  /// Formats a single date, omitting the year when it is the current year.
  /// - This year: "Aug 28"
  /// - Other year: "Aug 28, 2023"
  String formatDate() {
    final isCurrentYear = year == DateTime.now().year;
    return localizedDateFormat(isCurrentYear ? DateFormat.MMMd : DateFormat.yMMMd).format(this);
  }
}

/// Extension to format date ranges according to UI requirements
extension DateRangeFormatting on DateTime {
  /// Formats a date range according to specific rules:
  /// - Single date of this year: "Aug 28"
  /// - Single date of other year: "Aug 28, 2023"
  /// - Date range of this year: "Mar 23-May 31"
  /// - Date range of other year: "Aug 28 - Sep 30, 2023"
  /// - Date range over multiple years: "Apr 17, 2021 - Apr 9, 2022"
  static String formatDateRange(DateTime startDate, DateTime endDate) {
    final currentYear = DateTime.now().year;

    // Check if it's a single date (same day)
    if (startDate.year == endDate.year && startDate.month == endDate.month && startDate.day == endDate.day) {
      return startDate.formatDate();
    }

    // It's a date range
    if (startDate.year == endDate.year) {
      final format = localizedDateFormat(DateFormat.MMMd);
      // Same year
      if (startDate.year == currentYear) {
        // Date range of this year: "Mar 23-May 31"
        return '${format.format(startDate)} - ${format.format(endDate)}';
      } else {
        // Date range of other year: "Aug 28 - Sep 30, 2023"
        return '${format.format(startDate)} - ${format.format(endDate)}, ${startDate.year}';
      }
    } else {
      // Date range over multiple years: "Apr 17, 2021 - Apr 9, 2022"
      final format = localizedDateFormat(DateFormat.yMMMd);
      return '${format.format(startDate)} - ${format.format(endDate)}';
    }
  }
}
