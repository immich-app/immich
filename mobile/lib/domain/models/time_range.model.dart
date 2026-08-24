// ignore_for_file: annotate_overrides

import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/utils/option.dart';

part 'time_range.model.freezed.dart';

@Freezed(copyWith: false)
class const TimeRange({final DateTime? from, final DateTime? to}) with _$TimeRange {
  // Patching is custom, which prevents using Freezed `copyWith`
  TimeRange copyWith({Option<DateTime>? from, Option<DateTime>? to}) =>
      TimeRange(from: from.patch(this.from), to: to.patch(this.to));

  TimeRange clearFrom() => TimeRange(to: to);
  TimeRange clearTo() => TimeRange(from: from);
}
