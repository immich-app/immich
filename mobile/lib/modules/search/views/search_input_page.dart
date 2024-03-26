import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/models/search_filter.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/camera_picker.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/display_option_picker.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/location_picker.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/media_type_picker.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/people_picker.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/modules/search/ui/search_filter/search_filter_utils.dart';

@RoutePage()
class SearchInputPage extends HookConsumerWidget {
  const SearchInputPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = useState<SearchFilter>(
      SearchFilter(
        personIds: {},
        location: SearchLocationFilter(),
        camera: SearchCameraFilter(),
        date: SearchDateFilter(),
        display: SearchDisplayFilters(
          isNotInAlbum: false,
          isArchive: false,
          isFavorite: false,
        ),
      ),
    );

    search() {
      debugPrint("Search this");
      debugPrint(filter.value.toString());
    }

    showPeoplePicker() {
      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        child: FractionallySizedBox(
          heightFactor: 0.8,
          child: FilterBottomSheetScaffold(
            title: 'Select people',
            expanded: true,
            onSearch: () {},
            onClear: () {},
            child: PeoplePicker(
              onTap: (value) {},
            ),
          ),
        ),
      );
    }

    showLocationPicker() {
      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: false,
        child: FilterBottomSheetScaffold(
          title: 'Select location',
          onSearch: () {},
          onClear: () {},
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: LocationPicker(
                onSelected: (value) {
                  debugPrint("camera selected: $value");
                },
              ),
            ),
          ),
        ),
      );
    }

    showCameraPicker() {
      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: false,
        child: FilterBottomSheetScaffold(
          title: 'Select camera type',
          onSearch: () => search(),
          onClear: () {},
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: CameraPicker(
                onSelected: (value) {
                  debugPrint("camera selected: $value");
                },
              ),
            ),
          ),
        ),
      );
    }

    showDatePicker() async {
      final firstDate = DateTime(1900);
      final lastDate = DateTime.now();

      final date = await showDateRangePicker(
        context: context,
        firstDate: firstDate,
        lastDate: lastDate,
        currentDate: DateTime.now(),
        initialDateRange: DateTimeRange(
          start: DateTime.now().subtract(const Duration(days: 2)),
          end: lastDate,
        ),
        helpText: 'Select a date range',
        cancelText: 'Cancel',
        confirmText: 'Select',
        saveText: 'Save',
        errorFormatText: 'Invalid date format',
        errorInvalidText: 'Invalid date',
        fieldStartHintText: 'Start date',
        fieldEndHintText: 'End date',
        initialEntryMode: DatePickerEntryMode.input,
      );

      debugPrint("Pick: $date");
    }

    showMediaTypePicker() {
      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'Select media type',
          onSearch: () {},
          onClear: () {},
          child: MediaTypePicker(
            onSelect: (value) {
              debugPrint("Selected media type: $value");
            },
          ),
        ),
      );
    }

    showDisplayOptionPicker() {
      handleOnSelected(Map<DisplayOption, bool> value) {
        value.forEach((key, value) {
          switch (key) {
            case DisplayOption.notInAlbum:
              filter.value = filter.value.copyWith(
                display: filter.value.display.copyWith(
                  isNotInAlbum: value,
                ),
              );
              break;
            case DisplayOption.archive:
              filter.value = filter.value.copyWith(
                display: filter.value.display.copyWith(
                  isArchive: value,
                ),
              );
              break;
            case DisplayOption.favorite:
              filter.value = filter.value.copyWith(
                display: filter.value.display.copyWith(
                  isFavorite: value,
                ),
              );
              break;
          }
        });
      }

      handleClearDisplayOption() {
        filter.value = filter.value.copyWith(
          display: SearchDisplayFilters(
            isNotInAlbum: false,
            isArchive: false,
            isFavorite: false,
          ),
        );
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'Display options',
          onSearch: search,
          onClear: handleClearDisplayOption,
          child: DisplayOptionPicker(
            onSelect: handleOnSelected,
            filter: filter.value.display,
          ),
        ),
      );
    }

    buildDisplayOptionFilter() {
      final display = filter.value.display;
      final filters = <String>[];

      if (!display.isArchive && !display.isFavorite && !display.isNotInAlbum) {
        return null;
      }

      if (display.isNotInAlbum) {
        filters.add('Not in album');
      }

      if (display.isFavorite) {
        filters.add('Favorite');
      }

      if (display.isArchive) {
        filters.add('Archive');
      }

      return Text(
        filters.join(', '),
        style: TextStyle(color: context.primaryColor),
      );
    }

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        automaticallyImplyLeading: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () {
            context.router.pop();
          },
        ),
        title: TextField(
          decoration: InputDecoration(
            hintText: 'search_bar_hint'.tr(),
            hintStyle: context.textTheme.bodyLarge?.copyWith(
              color: context.themeData.colorScheme.onSurface.withOpacity(0.75),
            ),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
          ),
          onSubmitted: (value) {},
        ),
      ),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 12.0),
            child: SizedBox(
              height: 50,
              child: ListView(
                shrinkWrap: true,
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  SearchFilterChip(onTap: showPeoplePicker, label: 'People'),
                  SearchFilterChip(
                    onTap: showLocationPicker,
                    label: 'Location',
                  ),
                  SearchFilterChip(onTap: showCameraPicker, label: 'Camera'),
                  SearchFilterChip(onTap: showDatePicker, label: 'Date'),
                  SearchFilterChip(
                    onTap: showMediaTypePicker,
                    label: 'Media Type',
                  ),
                  SearchFilterChip(
                    onTap: showDisplayOptionPicker,
                    label: 'Display Options',
                    currentFilter: buildDisplayOptionFilter(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
