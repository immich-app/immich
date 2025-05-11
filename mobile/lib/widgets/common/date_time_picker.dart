import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/widgets/common/dropdown_search_menu.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/timezone.dart';

Future<String?> showDateTimePicker({
  required BuildContext context,
  DateTime? initialDateTime,
  String? initialTZ,
  Duration? initialTZOffset,
}) {
  return showDialog<String?>(
    context: context,
    builder: (context) => _DateTimePicker(
      initialDateTime: initialDateTime,
      initialTZ: initialTZ,
      initialTZOffset: initialTZOffset,
    ),
  );
}

String _getFormattedOffset(int offsetInMilli, tz.Location location) {
  return "${location.name} (${Duration(milliseconds: offsetInMilli).formatAsOffset()})";
}

class _DateTimePicker extends HookWidget {
  final DateTime? initialDateTime;
  final String? initialTZ;
  final Duration? initialTZOffset;

  const _DateTimePicker({
    this.initialDateTime,
    this.initialTZ,
    this.initialTZOffset,
  });

  _TimeZoneOffset _getInitiationLocation() {
    if (initialTZ != null) {
      try {
        return _TimeZoneOffset.fromLocation(
          tz.timeZoneDatabase.get(initialTZ!),
        );
      } on LocationNotFoundException {
        // no-op
      }
    }

    Duration? tzOffset = initialTZOffset ?? initialDateTime?.timeZoneOffset;

    if (tzOffset != null) {
      final offsetInMilli = tzOffset.inMilliseconds;
      // get all locations with matching offset
      final locations = tz.timeZoneDatabase.locations.values.where(
        (location) => location.currentTimeZone.offset == offsetInMilli,
      );
      // Prefer locations with abbreviation first
      final location = locations.firstWhereOrNull(
            (e) => !e.currentTimeZone.abbreviation.contains("0"),
          ) ??
          locations.firstOrNull;
      if (location != null) {
        return _TimeZoneOffset.fromLocation(location);
      }
    }

    return _TimeZoneOffset.fromLocation(tz.getLocation("UTC"));
  }

  // returns a list of location<name> along with it's offset in duration
  List<_TimeZoneOffset> getAllTimeZones() {
    return tz.timeZoneDatabase.locations.values
        .map(_TimeZoneOffset.fromLocation)
        .sorted()
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final date = useState<DateTime>(initialDateTime ?? DateTime.now());
    final tzOffset = useState<_TimeZoneOffset>(_getInitiationLocation());
    final timeZones = useMemoized(() => getAllTimeZones(), const []);
    final menuEntries = timeZones
        .map(
          (timezone) => DropdownMenuEntry<_TimeZoneOffset>(
            value: timezone,
            label: timezone.display,
            style: ButtonStyle(
              textStyle: WidgetStatePropertyAll(
                context.textTheme.bodyMedium,
              ),
            ),
          ),
        )
        .toList();

    void pickDate() async {
      final now = DateTime.now();
      // Handles cases where the date from the asset is far off in the future
      final initialDate = date.value.isAfter(now) ? now : date.value;
      final newDate = await showDatePicker(
        context: context,
        initialDate: initialDate,
        firstDate: DateTime(1800),
        lastDate: now,
      );
      if (newDate == null) {
        return;
      }

      final newTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(date.value),
      );

      if (newTime == null) {
        return;
      }

      date.value = newDate.copyWith(hour: newTime.hour, minute: newTime.minute);
    }

    void popWithDateTime() {
      final formattedDateTime =
          DateFormat("yyyy-MM-dd'T'HH:mm:ss").format(date.value);
      final dtWithOffset = formattedDateTime +
          Duration(milliseconds: tzOffset.value.offsetInMilliseconds)
              .formatAsOffset();
      context.pop(dtWithOffset);
    }

    return AlertDialog(
      contentPadding: const EdgeInsets.symmetric(vertical: 32, horizontal: 18),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            "cancel",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colorScheme.error,
            ),
          ).tr(),
        ),
        TextButton(
          onPressed: popWithDateTime,
          child: Text(
            "action_common_update",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: context.primaryColor,
            ),
          ).tr(),
        ),
      ],
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "date_and_time",
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ).tr(),
          const SizedBox(height: 32),
          ListTile(
            tileColor: context.colorScheme.surfaceContainerHighest,
            shape: ShapeBorder.lerp(
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              1,
            ),
            trailing: Icon(
              Icons.edit_outlined,
              size: 18,
              color: context.primaryColor,
            ),
            title: Text(
              DateFormat("dd-MM-yyyy hh:mm a").format(date.value),
              style: context.textTheme.bodyMedium,
            ).tr(),
            onTap: pickDate,
          ),
          const SizedBox(height: 24),
          DropdownSearchMenu(
            trailingIcon: Icon(
              Icons.arrow_drop_down,
              color: context.primaryColor,
            ),
            hintText: "timezone".tr(),
            label: const Text('timezone').tr(),
            textStyle: context.textTheme.bodyMedium,
            onSelected: (value) => tzOffset.value = value,
            initialSelection: tzOffset.value,
            dropdownMenuEntries: menuEntries,
          ),
        ],
      ),
    );
  }
}

class _TimeZoneOffset implements Comparable<_TimeZoneOffset> {
  final String display;
  final Location location;

  const _TimeZoneOffset({
    required this.display,
    required this.location,
  });

  _TimeZoneOffset copyWith({
    String? display,
    Location? location,
  }) {
    return _TimeZoneOffset(
      display: display ?? this.display,
      location: location ?? this.location,
    );
  }

  int get offsetInMilliseconds => location.currentTimeZone.offset;

  _TimeZoneOffset.fromLocation(tz.Location l)
      : display = _getFormattedOffset(l.currentTimeZone.offset, l),
        location = l;

  @override
  int compareTo(_TimeZoneOffset other) {
    return offsetInMilliseconds.compareTo(other.offsetInMilliseconds);
  }

  @override
  String toString() =>
      '_TimeZoneOffset(display: $display, location: $location)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is _TimeZoneOffset &&
        other.display == display &&
        other.offsetInMilliseconds == offsetInMilliseconds;
  }

  @override
  int get hashCode =>
      display.hashCode ^ offsetInMilliseconds.hashCode ^ location.hashCode;
}
