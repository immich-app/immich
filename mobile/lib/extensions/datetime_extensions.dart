import 'package:easy_localization/easy_localization.dart';

/// The active locale for date/time formatting, falling back to `en_US` for
/// supported locales that intl has no date-formatting data for.
String resolvedDateTimeLocale() =>
    Intl.verifiedLocale(Intl.defaultLocale, DateFormat.localeExists, onFailure: (_) => 'en_US')!;

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
  /// 24-hour `HH:mm` when [alwaysUse24HourFormat], otherwise the locale's 12-hour format.
  String formatTime({required bool alwaysUse24HourFormat}) {
    final locale = resolvedDateTimeLocale();
    return alwaysUse24HourFormat ? DateFormat.Hm(locale).format(this) : DateFormat.jm(locale).format(this);
  }
}

extension DateFormatting on DateTime {
  /// Formats a single date, omitting the year when it is the current year.
  String formatDate() {
    final locale = resolvedDateTimeLocale();
    return year == DateTime.now().year ? DateFormat.MMMd(locale).format(this) : DateFormat.yMMMd(locale).format(this);
  }
}

extension DateRangeFormatting on DateTime {
  /// Formats a date range according to specific rules:
  /// - Single date of this year: "Aug 28"
  /// - Single date of other year: "Aug 28, 2023"
  /// - Date range of this year: "Mar 23-May 31"
  /// - Date range of other year: "Aug 28 - Sep 30, 2023"
  /// - Date range over multiple years: "Apr 17, 2021 - Apr 9, 2022"
  static String formatDateRange(DateTime startDate, DateTime endDate) {
    if (startDate.year == endDate.year && startDate.month == endDate.month && startDate.day == endDate.day) {
      return startDate.formatDate();
    }

    final locale = resolvedDateTimeLocale();

    if (startDate.year == endDate.year) {
      final format = DateFormat.MMMd(locale);
      final range = '${format.format(startDate)} - ${format.format(endDate)}';
      return startDate.year == DateTime.now().year ? range : '$range, ${startDate.year}';
    }

    final format = DateFormat.yMMMd(locale);
    return '${format.format(startDate)} - ${format.format(endDate)}';
  }
}
