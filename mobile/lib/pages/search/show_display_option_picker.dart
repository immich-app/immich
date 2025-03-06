import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/is_searching.provider.dart';
import 'package:immich_mobile/providers/search/search_filters.provider.dart';
import 'package:immich_mobile/widgets/search/search_filter/display_option_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';

class ShowDisplayOptionsPicker extends ConsumerWidget {
  const ShowDisplayOptionsPicker({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final display =
        ref.watch(searchFiltersProvider.select((filters) => filters.display));

    showDisplayOptionPicker() {
      handleOnSelect(Map<DisplayOption, bool> value) {
        value.forEach((key, value) {
          ref.read(searchFiltersProvider.notifier).display = switch (key) {
            DisplayOption.notInAlbum => display.copyWith(isNotInAlbum: value),
            DisplayOption.archive => display.copyWith(isArchive: value),
            DisplayOption.favorite => display.copyWith(isFavorite: value),
          };
        });
      }

      handleClear() {
        ref.read(searchFiltersProvider.notifier).display =
            const SearchDisplayFilters(
          isNotInAlbum: false,
          isArchive: false,
          isFavorite: false,
        );
        ref.read(searchFiltersProvider.notifier).search();
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_display_options_title'.tr(),
          onSearch: () => ref.read(isSearchingProvider.notifier).value = true,
          onClear: handleClear,
          child: DisplayOptionPicker(
            onSelect: handleOnSelect,
            filter: display,
          ),
        ),
      );
    }

    return SearchFilterChip(
      icon: Icons.display_settings_outlined,
      onTap: showDisplayOptionPicker,
      label: 'search_filter_display_options'.tr(),
      currentFilter: Text(
        getFormattedText(display),
        style: context.textTheme.labelLarge,
      ),
    );
  }

  getFormattedText(SearchDisplayFilters display) {
    return [
      if (display.isNotInAlbum)
        'search_filter_display_option_not_in_album'.tr(),
      if (display.isArchive) 'search_filter_display_option_archive'.tr(),
      if (display.isFavorite) 'search_filter_display_option_favorite'.tr(),
    ].join(', ');
  }
}
