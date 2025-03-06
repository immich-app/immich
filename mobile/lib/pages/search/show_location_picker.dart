import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/is_searching.provider.dart';
import 'package:immich_mobile/providers/search/search_filters.provider.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/location_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';

class ShowLocationPicker extends ConsumerWidget {
  const ShowLocationPicker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location =
        ref.watch(searchFiltersProvider.select((filters) => filters.location));

    showLocationPicker() {
      handleOnSelect(Map<String, String?> value) {
        ref.read(searchFiltersProvider.notifier).location =
            SearchLocationFilter(
          country: value['country'],
          city: value['city'],
          state: value['state'],
        );
      }

      handleClear() {
        ref.read(searchFiltersProvider.notifier).location =
            const SearchLocationFilter();
        ref.read(searchFiltersProvider.notifier).search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: true,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_location_title'.tr(),
          onSearch: () => ref.read(isSearchingProvider.notifier).value = true,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: Container(
              padding: EdgeInsets.only(
                bottom: context.viewInsets.bottom,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: LocationPicker(
                  onSelected: handleOnSelect,
                  filter: location,
                ),
              ),
            ),
          ),
        ),
      );
    }

    return SearchFilterChip(
      icon: Icons.location_pin,
      onTap: showLocationPicker,
      label: 'search_filter_location'.tr(),
      currentFilter: Text(
        getFormattedText(location.city, location.state, location.country),
        style: context.textTheme.labelLarge,
      ),
    );
  }

  String getFormattedText(String? city, String? state, String? country) {
    return [
      if (city != null) city,
      if (state != null) state,
      if (country != null) country,
    ].join(', ');
  }
}
