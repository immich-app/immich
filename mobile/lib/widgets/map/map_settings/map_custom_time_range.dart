import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:intl/intl.dart';

class MapCustomTimeRange extends StatelessWidget {
  const MapCustomTimeRange({super.key, required this.customTimeRange, required this.onChanged});

  final TimeRange customTimeRange;
  final Function(TimeRange) onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ListTile(
          title: Text("date_after".t(context: context)),
          subtitle: Text(
            customTimeRange.from != null
                ? DateFormat.yMMMd().add_jm().format(customTimeRange.from!)
                : "not_set".t(context: context),
          ),
          trailing: customTimeRange.from != null
              ? IconButton(icon: const Icon(Icons.close), onPressed: () => onChanged(customTimeRange.clearFrom()))
              : null,
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: customTimeRange.from ?? DateTime.now(),
              firstDate: DateTime(1970),
              lastDate: DateTime.now(),
            );
            if (picked != null) {
              onChanged(customTimeRange.copyWith(from: picked));
            }
          },
        ),
        ListTile(
          title: Text("date_before".t(context: context)),
          subtitle: Text(
            customTimeRange.to != null
                ? DateFormat.yMMMd().add_jm().format(customTimeRange.to!)
                : "not_set".t(context: context),
          ),
          trailing: customTimeRange.to != null
              ? IconButton(icon: const Icon(Icons.close), onPressed: () => onChanged(customTimeRange.clearTo()))
              : null,
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: customTimeRange.to ?? DateTime.now(),
              firstDate: DateTime(1970),
              lastDate: DateTime.now(),
            );
            if (picked != null) {
              onChanged(customTimeRange.copyWith(to: picked));
            }
          },
        ),
      ],
    );
  }
}
