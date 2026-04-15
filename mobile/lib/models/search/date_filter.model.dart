import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

sealed class DateFilterInputModel {
  const DateFilterInputModel();
  bool get isEmpty => asDateTimeRange() == null;
  DateTimeRange<DateTime>? asDateTimeRange();

  String asHumanReadable(BuildContext context) {
    final date = asDateTimeRange();
    if (date == null) return '';
    if (date.end.difference(date.start).inHours < 24) {
      return DateFormat.yMMMd().format(date.start.toLocal());
    } else {
      return 'search_filter_date_interval'.t(
        context: context,
        args: {
          "start": DateFormat.yMMMd().format(date.start.toLocal()),
          "end": DateFormat.yMMMd().format(date.end.toLocal()),
        },
      );
    }
  }
}

class RecentMonthRangeFilter extends DateFilterInputModel {
  final int monthDelta;

  const RecentMonthRangeFilter(this.monthDelta);

  @override
  DateTimeRange<DateTime> asDateTimeRange() {
    final now = DateTime.now();
    // Note that DateTime's constructor properly handles month overflow.
    final from = DateTime(now.year, now.month - monthDelta, 1);
    return DateTimeRange<DateTime>(start: from, end: now);
  }

  @override
  String asHumanReadable(BuildContext context) {
    return 'last_months'.t(context: context, args: {"count": monthDelta.toString()});
  }
}

class YearFilter extends DateFilterInputModel {
  final int year;
  const YearFilter(this.year);

  @override
  DateTimeRange<DateTime> asDateTimeRange() {
    final now = DateTime.now();
    final from = DateTime(year, 1, 1);

    if (now.year == year) {
      // To not go beyond today if the user picks the current year
      return DateTimeRange<DateTime>(start: from, end: now);
    }

    final to = DateTime(year, 12, 31, 23, 59, 59);
    return DateTimeRange<DateTime>(start: from, end: to);
  }

  @override
  String asHumanReadable(BuildContext context) {
    return 'in_year'.tr(namedArgs: {"year": year.toString()});
  }
}

class EmptyDateFilter extends DateFilterInputModel {
  const EmptyDateFilter();

  @override
  DateTimeRange<DateTime>? asDateTimeRange() => null;
}

class CustomDateFilter extends DateFilterInputModel {
  final DateTime start;
  final DateTime end;

  const CustomDateFilter._(this.start, this.end);

  factory CustomDateFilter.fromRange(DateTimeRange<DateTime> range) {
    return CustomDateFilter._(range.start, range.end.add(const Duration(hours: 23, minutes: 59, seconds: 59)));
  }

  @override
  DateTimeRange<DateTime> asDateTimeRange() {
    return DateTimeRange<DateTime>(start: start, end: end);
  }
}
