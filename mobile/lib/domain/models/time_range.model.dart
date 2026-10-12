import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/option.dart';

part 'time_range.model.freezed.dart';

// copyWith is hand-written so that fields can be cleared via optionals
@Freezed(copyWith: false, fromJson: false, toJson: false)
abstract class TimeRange with _$TimeRange {
  const TimeRange._();

  const factory TimeRange({DateTime? from, DateTime? to}) = _TimeRange;

  TimeRange copyWith({Option<DateTime>? from, Option<DateTime>? to}) {
    return TimeRange(from: from.patch(this.from), to: to.patch(this.to));
  }

  TimeRange clearFrom() => TimeRange(to: to);
  TimeRange clearTo() => TimeRange(from: from);
}
