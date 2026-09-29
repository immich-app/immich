import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/time_range.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/utils/option.dart';

class MapTimeRange extends StatelessWidget {
  const MapTimeRange({super.key, required this.timeRange, required this.onChanged});

  final TimeRange timeRange;
  final Function(TimeRange) onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ListTile(
          title: Text(context.t.date_after),
          subtitle: Text(
            timeRange.from != null
                ? DateFormat.yMMMd(context.locale.toLanguageTag()).add_jm().format(timeRange.from!)
                : context.t.not_set,
          ),
          trailing: timeRange.from != null
              ? IconButton(icon: const Icon(Icons.close), onPressed: () => onChanged(timeRange.clearFrom()))
              : null,
          onTap: () async {
            final initial = timeRange.from ?? DateTime.now();
            final currentTo = timeRange.to;

            final picked = await showDatePicker(
              context: context,
              initialDate: currentTo != null && initial.isAfter(currentTo) ? currentTo : initial,
              firstDate: DateTime(1970),
              lastDate: currentTo ?? DateTime.now(),
            );

            if (picked != null) {
              onChanged(timeRange.copyWith(from: Option.some(picked)));
            }
          },
        ),
        ListTile(
          title: Text(context.t.date_before),
          subtitle: Text(
            timeRange.to != null
                ? DateFormat.yMMMd(context.locale.toLanguageTag()).add_jm().format(timeRange.to!)
                : context.t.not_set,
          ),
          trailing: timeRange.to != null
              ? IconButton(icon: const Icon(Icons.close), onPressed: () => onChanged(timeRange.clearTo()))
              : null,
          onTap: () async {
            final initial = timeRange.to ?? DateTime.now();
            final currentFrom = timeRange.from;

            final picked = await showDatePicker(
              context: context,
              initialDate: currentFrom != null && initial.isBefore(currentFrom) ? currentFrom : initial,
              firstDate: currentFrom ?? DateTime(1970),
              lastDate: DateTime.now(),
            );

            if (picked != null) {
              onChanged(timeRange.copyWith(to: Option.some(picked)));
            }
          },
        ),
      ],
    );
  }
}
