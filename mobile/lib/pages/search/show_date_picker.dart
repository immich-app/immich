import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/search_filters.provider.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';

class ShowDatePicker extends ConsumerWidget {
  const ShowDatePicker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final date =
        ref.watch(searchFiltersProvider.select((filters) => filters.date));

    showDatePicker() async {
      final firstDate = DateTime(1900);
      final lastDate = DateTime.now();

      final dateRange = await showDateRangePicker(
        context: context,
        firstDate: firstDate,
        lastDate: lastDate,
        currentDate: DateTime.now(),
        initialDateRange: DateTimeRange(
          start: date.takenAfter ?? lastDate,
          end: date.takenBefore ?? lastDate,
        ),
        helpText: 'search_filter_date_title'.tr(),
        cancelText: 'action_common_cancel'.tr(),
        confirmText: 'action_common_select'.tr(),
        saveText: 'action_common_save'.tr(),
        errorFormatText: 'invalid_date_format'.tr(),
        errorInvalidText: 'invalid_date'.tr(),
        fieldStartHintText: 'start_date'.tr(),
        fieldEndHintText: 'end_date'.tr(),
        initialEntryMode: DatePickerEntryMode.calendar,
        keyboardType: TextInputType.text,
      );

      if (dateRange == null) {
        ref.read(searchFiltersProvider.notifier).date =
            const SearchDateFilter();
        return;
      }

      ref.read(searchFiltersProvider.notifier).date = SearchDateFilter(
        takenAfter: dateRange.start,
        takenBefore: dateRange.end.add(
          const Duration(
            hours: 23,
            minutes: 59,
            seconds: 59,
          ),
        ),
      );
      ref.read(searchFiltersProvider.notifier).search();
    }

    return SearchFilterChip(
      icon: Icons.date_range_rounded,
      onTap: showDatePicker,
      label: 'search_filter_date'.tr(),
      currentFilter: Text(
        getFormattedText(date.takenAfter, date.takenBefore),
        style: context.textTheme.labelLarge,
      ),
    );
  }

  String getFormattedText(DateTime? start, DateTime? end) {
    if (start == null || end == null) {
      return '';
    }

    if (end.difference(start).inHours < 24) {
      return DateFormat.yMMMd().format(start.toLocal());
    }

    return 'search_filter_date_interval'.tr(
      namedArgs: {
        "start": DateFormat.yMMMd().format(start.toLocal()),
        "end": DateFormat.yMMMd().format(end.toLocal()),
      },
    );
  }
}
