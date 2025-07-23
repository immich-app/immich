import 'dart:ui';
import 'package:easy_localization/easy_localization.dart';

extension TimeAgoExtension on DateTime {
  /// Displays the time difference of this [DateTime] object to the current time as a [String]
  String timeAgo({bool numericDates = true}) {
    DateTime date = toLocal();
    final now = DateTime.now().toLocal();
    final difference = now.difference(date);

    if (difference.inSeconds < 5) {
      return 'Just now';
    } else if (difference.inSeconds < 60) {
      return '${difference.inSeconds} seconds ago';
    } else if (difference.inMinutes <= 1) {
      return (numericDates) ? '1 minute ago' : 'A minute ago';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} minutes ago';
    } else if (difference.inHours <= 1) {
      return (numericDates) ? '1 hour ago' : 'An hour ago';
    } else if (difference.inHours < 60) {
      return '${difference.inHours} hours ago';
    } else if (difference.inDays <= 1) {
      return (numericDates) ? '1 day ago' : 'Yesterday';
    } else if (difference.inDays < 6) {
      return '${difference.inDays} days ago';
    } else if ((difference.inDays / 7).ceil() <= 1) {
      return (numericDates) ? '1 week ago' : 'Last week';
    } else if ((difference.inDays / 7).ceil() < 4) {
      return '${(difference.inDays / 7).ceil()} weeks ago';
    } else if ((difference.inDays / 30).ceil() <= 1) {
      return (numericDates) ? '1 month ago' : 'Last month';
    } else if ((difference.inDays / 30).ceil() < 30) {
      return '${(difference.inDays / 30).ceil()} months ago';
    } else if ((difference.inDays / 365).ceil() <= 1) {
      return (numericDates) ? '1 year ago' : 'Last year';
    }
    return '${(difference.inDays / 365).floor()} years ago';
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
  static String formatDateRange(
    DateTime startDate,
    DateTime endDate,
    Locale? locale,
  ) {
    final now = DateTime.now();
    final currentYear = now.year;
    final localeString = locale?.toString() ?? 'en_US';

    // Check if it's a single date (same day)
    if (startDate.year == endDate.year &&
        startDate.month == endDate.month &&
        startDate.day == endDate.day) {
      if (startDate.year == currentYear) {
        // Single date of this year: "Aug 28"
        return DateFormat.MMMd(localeString).format(startDate);
      } else {
        // Single date of other year: "Aug 28, 2023"
        return DateFormat.yMMMd(localeString).format(startDate);
      }
    }

    // It's a date range
    if (startDate.year == endDate.year) {
      // Same year
      if (startDate.year == currentYear) {
        // Date range of this year: "Mar 23-May 31"
        final startFormatted = DateFormat.MMMd(localeString).format(startDate);
        final endFormatted = DateFormat.MMMd(localeString).format(endDate);
        return '$startFormatted - $endFormatted';
      } else {
        // Date range of other year: "Aug 28 - Sep 30, 2023"
        final startFormatted = DateFormat.MMMd(localeString).format(startDate);
        final endFormatted = DateFormat.MMMd(localeString).format(endDate);
        return '$startFormatted - $endFormatted, ${startDate.year}';
      }
    } else {
      // Date range over multiple years: "Apr 17, 2021 - Apr 9, 2022"
      final startFormatted = DateFormat.yMMMd(localeString).format(startDate);
      final endFormatted = DateFormat.yMMMd(localeString).format(endDate);
      return '$startFormatted - $endFormatted';
    }
  }
}
