import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class MapTimeDropDown extends StatelessWidget {
  final int relativeTime;
  final Function(int) onTimeChange;

  const MapTimeDropDown({
    super.key,
    required this.relativeTime,
    required this.onTimeChange,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Text(
            "map_settings_only_relative_range".tr(),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        LayoutBuilder(
          builder: (_, constraints) => DropdownMenu(
            width: constraints.maxWidth * 0.9,
            enableSearch: false,
            enableFilter: false,
            initialSelection: relativeTime,
            onSelected: (value) => onTimeChange(value!),
            dropdownMenuEntries: [
              DropdownMenuEntry(
                value: 0,
                label: "map_settings_date_range_option_all".tr(),
              ),
              DropdownMenuEntry(
                value: 1,
                label: "map_settings_date_range_option_day".tr(),
              ),
              DropdownMenuEntry(
                value: 7,
                label: "map_settings_date_range_option_days".tr(
                  args: ["7"],
                ),
              ),
              DropdownMenuEntry(
                value: 30,
                label: "map_settings_date_range_option_days".tr(
                  args: ["30"],
                ),
              ),
              DropdownMenuEntry(
                value: now
                    .difference(
                      DateTime(
                        now.year - 1,
                        now.month,
                        now.day,
                        now.hour,
                        now.minute,
                        now.second,
                      ),
                    )
                    .inDays,
                label: "map_settings_date_range_option_year".tr(),
              ),
              DropdownMenuEntry(
                value: now
                    .difference(
                      DateTime(
                        now.year - 3,
                        now.month,
                        now.day,
                        now.hour,
                        now.minute,
                        now.second,
                      ),
                    )
                    .inDays,
                label: "map_settings_date_range_option_years".tr(args: ["3"]),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
