import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:intl/intl.dart';

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
          title: Text("date_after".t(context: context)),
          subtitle: Text(
            timeRange.from != null
                ? DateFormat.yMMMd().add_jm().format(timeRange.from!)
                : "not_set".t(context: context),
          ),
          trailing: timeRange.from != null
              ? IconButton(icon: const Icon(Icons.close), onPressed: () => onChanged(timeRange.clearFrom()))
              : null,
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: timeRange.from ?? DateTime.now(),
              firstDate: DateTime(1970),
              lastDate: DateTime.now(),
            );
            if (picked != null) {
              onChanged(timeRange.copyWith(from: picked));
            }
          },
        ),
        ListTile(
          title: Text("date_before".t(context: context)),
          subtitle: Text(
            timeRange.to != null ? DateFormat.yMMMd().add_jm().format(timeRange.to!) : "not_set".t(context: context),
          ),
          trailing: timeRange.to != null
              ? IconButton(icon: const Icon(Icons.close), onPressed: () => onChanged(timeRange.clearTo()))
              : null,
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: timeRange.to ?? DateTime.now(),
              firstDate: DateTime(1970),
              lastDate: DateTime.now(),
            );
            if (picked != null) {
              onChanged(timeRange.copyWith(to: picked));
            }
          },
        ),
      ],
    );
  }
}
