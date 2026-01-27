import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

class MapTimeDropDown extends StatelessWidget {
  final int relativeTime;
  final Function(int) onTimeChange;

  const MapTimeDropDown({super.key, required this.relativeTime, required this.onTimeChange});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 28.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            "date_range".t(context: context),
            style: context.textTheme.bodyLarge!.copyWith(fontWeight: FontWeight.w500, height: 1.5),
          ),
          Flexible(
            child: DropdownMenu(
              enableSearch: false,
              enableFilter: false,
              initialSelection: relativeTime,
              onSelected: (value) => onTimeChange(value!),
              dropdownMenuEntries: [
                DropdownMenuEntry(value: 0, label: "all".t(context: context)),
                DropdownMenuEntry(value: 1, label: "map_settings_date_range_option_day".t(context: context)),
                DropdownMenuEntry(value: 7, label: "map_settings_date_range_option_days".tr(namedArgs: {'days': "7"})),
                DropdownMenuEntry(
                  value: 30,
                  label: "map_settings_date_range_option_days".tr(namedArgs: {'days': "30"}),
                ),
                DropdownMenuEntry(
                  value: now
                      .difference(DateTime(now.year - 1, now.month, now.day, now.hour, now.minute, now.second))
                      .inDays,
                  label: "map_settings_date_range_option_year".t(context: context),
                ),
                DropdownMenuEntry(
                  value: now
                      .difference(DateTime(now.year - 3, now.month, now.day, now.hour, now.minute, now.second))
                      .inDays,
                  label: "map_settings_date_range_option_years".t(args: {'years': "3"}),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
