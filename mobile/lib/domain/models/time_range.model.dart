import 'package:immich_mobile/utils/option.dart';

class TimeRange {
  final DateTime? from;
  final DateTime? to;

  const TimeRange({this.from, this.to});

  TimeRange copyWith({Option<DateTime>? from, Option<DateTime>? to}) {
    return TimeRange(from: from.patch(this.from), to: to.patch(this.to));
  }

  TimeRange clearFrom() => TimeRange(to: to);
  TimeRange clearTo() => TimeRange(from: from);
}
