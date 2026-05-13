import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
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
            timeRange.from.fold(
              (from) => DateFormat.yMMMd(context.locale.toString()).add_jm().format(from),
              () => context.t.not_set,
            ),
          ),
          trailing: timeRange.from.isSome
              ? IconButton(icon: const Icon(Icons.close), onPressed: () => onChanged(timeRange.clearFrom()))
              : null,
          onTap: () async {
            final initial = timeRange.from.unwrapOrNull ?? DateTime.now();

            final picked = await showDatePicker(
              context: context,
              initialDate: initial,
              firstDate: DateTime(1970),
              lastDate: DateTime.now(),
            );

            if (picked != null) {
              onChanged(timeRange.copyWith(from: Option.some(picked)));
            }
          },
        ),

        ListTile(
          title: Text(context.t.date_before),
          subtitle: Text(
            timeRange.to.fold<String>(
              (to) => DateFormat.yMMMd(context.locale.toString()).add_jm().format(to),
              () => context.t.not_set,
            ),
          ),
          trailing: timeRange.to.isSome
              ? IconButton(icon: const Icon(Icons.close), onPressed: () => onChanged(timeRange.clearTo()))
              : null,
          onTap: () async {
            final initial = timeRange.to.unwrapOrNull ?? DateTime.now();

            final picked = await showDatePicker(
              context: context,
              initialDate: initial,
              firstDate: DateTime(1970),
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
