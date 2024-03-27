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
import 'package:immich_mobile/shared/models/asset.dart';

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
        mediaType: AssetType.other,
      ),
    );

    final dateRangeCurrentFilterWidget = useState<Widget?>(null);
    final cameraCurrentFilterWidget = useState<Widget?>(null);
    final locationCurrentFilterWidget = useState<Widget?>(null);

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
              onTap: (value) {
                print("people picker value: $value");
              },
            ),
          ),
        ),
      );
    }

    showLocationPicker() {
      handleOnSelect(Map<String, String?> value) {
        filter.value = filter.value.copyWith(
          location: SearchLocationFilter(
            country: value['country'],
            city: value['city'],
            state: value['state'],
          ),
        );

        final locationText = <String>[];
        if (value['country'] != null) {
          locationText.add(value['country']!);
        }

        if (value['state'] != null) {
          locationText.add(value['state']!);
        }

        if (value['city'] != null) {
          locationText.add(value['city']!);
        }

        locationCurrentFilterWidget.value = Text(
          locationText.join(', '),
          style: context.textTheme.labelLarge,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(
          location: SearchLocationFilter(),
        );

        locationCurrentFilterWidget.value = null;
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: false,
        child: FilterBottomSheetScaffold(
          title: 'Select location',
          onSearch: search,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: LocationPicker(
                onSelected: handleOnSelect,
                filter: filter.value.location,
              ),
            ),
          ),
        ),
      );
    }

    showCameraPicker() {
      handleOnSelect(Map<String, String?> value) {
        filter.value = filter.value.copyWith(
          camera: SearchCameraFilter(
            make: value['make'],
            model: value['model'],
          ),
        );

        cameraCurrentFilterWidget.value = Text(
          '${value['make'] ?? ''} ${value['model'] ?? ''}',
          style: context.textTheme.labelLarge,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(
          camera: SearchCameraFilter(),
        );

        cameraCurrentFilterWidget.value = null;
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: false,
        child: FilterBottomSheetScaffold(
          title: 'Select camera type',
          onSearch: search,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: CameraPicker(
              onSelect: handleOnSelect,
              filter: filter.value.camera,
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
          start: filter.value.date.takenAfter ?? lastDate,
          end: filter.value.date.takenBefore ?? lastDate,
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

      if (date == null) {
        filter.value = filter.value.copyWith(
          date: SearchDateFilter(),
        );

        dateRangeCurrentFilterWidget.value = null;
        return;
      }

      filter.value = filter.value.copyWith(
        date: SearchDateFilter(
          takenAfter: date.start,
          takenBefore: date.end.add(
            const Duration(
              hours: 23,
              minutes: 59,
              seconds: 59,
            ),
          ),
        ),
      );

      // If date range is less than 24 hours, set the end date to the end of the day
      if (date.end.difference(date.start).inHours < 24) {
        dateRangeCurrentFilterWidget.value = Text(
          date.start.toLocal().toIso8601String().split('T').first,
          style: context.textTheme.labelLarge,
        );
      } else {
        dateRangeCurrentFilterWidget.value = Text(
          '${date.start.toLocal().toIso8601String().split('T').first} to ${date.end.toLocal().toIso8601String().split('T').first}',
          style: context.textTheme.labelLarge,
        );
      }

      search();
    }

    // MEDIA PICKER
    showMediaTypePicker() {
      handleOnSelected(AssetType assetType) {
        filter.value = filter.value.copyWith(
          mediaType: assetType,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(
          mediaType: AssetType.other,
        );
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'Select media type',
          onSearch: search,
          onClear: handleClear,
          child: MediaTypePicker(
            onSelect: handleOnSelected,
            filter: filter.value.mediaType,
          ),
        ),
      );
    }

    buildAssetTypeFilter() {
      switch (filter.value.mediaType) {
        case AssetType.image:
          return Text(
            'Image',
            style: context.textTheme.labelLarge,
          );
        case AssetType.video:
          return Text(
            'Video',
            style: context.textTheme.labelLarge,
          );
        case _:
          return null;
      }
    }

    // DISPLAY OPTION
    showDisplayOptionPicker() {
      handleOnSelect(Map<DisplayOption, bool> value) {
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

      handleClear() {
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
          onClear: handleClear,
          child: DisplayOptionPicker(
            onSelect: handleOnSelect,
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
        style: context.textTheme.labelLarge,
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
                  SearchFilterChip(
                    icon: Icons.people_alt_rounded,
                    onTap: showPeoplePicker,
                    label: 'People',
                  ),
                  SearchFilterChip(
                    icon: Icons.location_pin,
                    onTap: showLocationPicker,
                    label: 'Location',
                    currentFilter: locationCurrentFilterWidget.value,
                  ),
                  SearchFilterChip(
                    icon: Icons.camera_alt_rounded,
                    onTap: showCameraPicker,
                    label: 'Camera',
                    currentFilter: cameraCurrentFilterWidget.value,
                  ),
                  SearchFilterChip(
                    icon: Icons.date_range_rounded,
                    onTap: showDatePicker,
                    label: 'Date',
                    currentFilter: dateRangeCurrentFilterWidget.value,
                  ),
                  SearchFilterChip(
                    icon: Icons.video_collection_outlined,
                    onTap: showMediaTypePicker,
                    label: 'Media Type',
                    currentFilter: buildAssetTypeFilter(),
                  ),
                  SearchFilterChip(
                    icon: Icons.display_settings_outlined,
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
