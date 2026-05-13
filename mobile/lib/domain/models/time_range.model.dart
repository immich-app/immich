import 'package:immich_mobile/utils/option.dart';

class TimeRange {
  final Option<DateTime> from;
  final Option<DateTime> to;

  const TimeRange({this.from = const None(), this.to = const None()});

  TimeRange copyWith({Option<DateTime>? from, Option<DateTime>? to}) {
    return TimeRange(from: from ?? this.from, to: to ?? this.to);
  }

  TimeRange clearFrom() => TimeRange(to: to);
  TimeRange clearTo() => TimeRange(from: from);
}
