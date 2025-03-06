import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/providers/search/is_searching.provider.dart';
import 'package:immich_mobile/providers/search/search_filters.provider.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/people_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';

class ShowPeoplePicker extends ConsumerWidget {
  const ShowPeoplePicker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final people =
        ref.watch(searchFiltersProvider.select((filters) => filters.people));

    showPeoplePicker() {
      handleOnSelect(Set<Person> value) {
        ref.read(searchFiltersProvider.notifier).people = value;
      }

      handleClear() {
        ref.read(searchFiltersProvider.notifier).people = const {};
        ref.read(searchFiltersProvider.notifier).search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        child: FractionallySizedBox(
          heightFactor: 0.8,
          child: FilterBottomSheetScaffold(
            title: 'search_filter_people_title'.tr(),
            expanded: true,
            onSearch: () => ref.read(isSearchingProvider.notifier).value = true,
            onClear: handleClear,
            child: PeoplePicker(
              onSelect: handleOnSelect,
              filter: people,
            ),
          ),
        ),
      );
    }

    return SearchFilterChip(
      icon: Icons.people_alt_rounded,
      onTap: showPeoplePicker,
      label: 'search_filter_people'.tr(),
      currentFilter: Text(
        getFormattedText(people),
        style: context.textTheme.labelLarge,
      ),
    );
  }

  String getFormattedText(Set<Person> people) {
    final noName = 'no_name'.tr();
    return people.map((e) => e.name != '' ? e.name : noName).join(', ');
  }
}
