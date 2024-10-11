import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/paginated_search.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/widgets/search/search_filter/camera_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/display_option_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/location_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/media_type_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/people_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';

@RoutePage()
class SearchInputPage extends HookConsumerWidget {
  const SearchInputPage({super.key, this.prefilter});

  final SearchFilter? prefilter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isContextualSearch = useState(true);
    final textSearchController = useTextEditingController();
    final focusNode = useFocusNode();
    final filter = useState<SearchFilter>(
      SearchFilter(
        people: prefilter?.people ?? {},
        location: prefilter?.location ?? SearchLocationFilter(),
        camera: prefilter?.camera ?? SearchCameraFilter(),
        date: prefilter?.date ?? SearchDateFilter(),
        display: prefilter?.display ??
            SearchDisplayFilters(
              isNotInAlbum: false,
              isArchive: false,
              isFavorite: false,
            ),
        mediaType: prefilter?.mediaType ?? AssetType.other,
      ),
    );

    final previousFilter = useState(filter.value);

    final peopleCurrentFilterWidget = useState<Widget?>(null);
    final dateRangeCurrentFilterWidget = useState<Widget?>(null);
    final cameraCurrentFilterWidget = useState<Widget?>(null);
    final locationCurrentFilterWidget = useState<Widget?>(null);
    final mediaTypeCurrentFilterWidget = useState<Widget?>(null);
    final displayOptionCurrentFilterWidget = useState<Widget?>(null);

    final currentPage = useState(1);
    final searchProvider = ref.watch(paginatedSearchProvider);
    final searchResultCount = useState(0);

    search() async {
      if (prefilter == null && filter.value == previousFilter.value) return;

      ref.watch(paginatedSearchProvider.notifier).clear();

      currentPage.value = 1;

      final searchResult = await ref
          .watch(paginatedSearchProvider.notifier)
          .getNextPage(filter.value, currentPage.value);
      previousFilter.value = filter.value;

      searchResultCount.value = searchResult.length;
    }

    searchPrefilter() {
      if (prefilter != null) {
        Future.delayed(
          Duration.zero,
          () {
            search();

            if (prefilter!.location.city != null) {
              locationCurrentFilterWidget.value = Text(
                prefilter!.location.city!,
                style: context.textTheme.labelLarge,
              );
            }
          },
        );
      }
    }

    useEffect(
      () {
        searchPrefilter();
        return null;
      },
      [],
    );

    loadMoreSearchResult() async {
      currentPage.value += 1;
      final searchResult = await ref
          .watch(paginatedSearchProvider.notifier)
          .getNextPage(filter.value, currentPage.value);
      searchResultCount.value = searchResult.length;
    }

    showPeoplePicker() {
      handleOnSelect(Set<Person> value) {
        filter.value = filter.value.copyWith(
          people: value,
        );

        peopleCurrentFilterWidget.value = Text(
          value.map((e) => e.name != '' ? e.name : 'no_name'.tr()).join(', '),
          style: context.textTheme.labelLarge,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(
          people: {},
        );

        peopleCurrentFilterWidget.value = null;
        search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        child: FractionallySizedBox(
          heightFactor: 0.8,
          child: FilterBottomSheetScaffold(
            title: 'search_filter_people_title'.tr(),
            expanded: true,
            onSearch: search,
            onClear: handleClear,
            child: PeoplePicker(
              onSelect: handleOnSelect,
              filter: filter.value.people,
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
        search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: false,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_location_title'.tr(),
          onSearch: search,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: LocationPicker(
                  onSelected: handleOnSelect,
                  filter: filter.value.location,
                ),
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
        search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: false,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_camera_title'.tr(),
          onSearch: search,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
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
        helpText: 'search_filter_date_title'.tr(),
        cancelText: 'action_common_cancel'.tr(),
        confirmText: 'action_common_select'.tr(),
        saveText: 'action_common_save'.tr(),
        errorFormatText: 'invalid_date_format'.tr(),
        errorInvalidText: 'invalid_date'.tr(),
        fieldStartHintText: 'start_date'.tr(),
        fieldEndHintText: 'end_date'.tr(),
        initialEntryMode: DatePickerEntryMode.input,
      );

      if (date == null) {
        filter.value = filter.value.copyWith(
          date: SearchDateFilter(),
        );

        dateRangeCurrentFilterWidget.value = null;
        search();
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
          DateFormat.yMMMd().format(date.start.toLocal()),
          style: context.textTheme.labelLarge,
        );
      } else {
        dateRangeCurrentFilterWidget.value = Text(
          'search_filter_date_interval'.tr(
            namedArgs: {
              "start": DateFormat.yMMMd().format(date.start.toLocal()),
              "end": DateFormat.yMMMd().format(date.end.toLocal()),
            },
          ),
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

        mediaTypeCurrentFilterWidget.value = Text(
          assetType == AssetType.image
              ? 'search_filter_media_type_image'.tr()
              : assetType == AssetType.video
                  ? 'search_filter_media_type_video'.tr()
                  : 'search_filter_media_type_all'.tr(),
          style: context.textTheme.labelLarge,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(
          mediaType: AssetType.other,
        );

        mediaTypeCurrentFilterWidget.value = null;
        search();
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_media_type_title'.tr(),
          onSearch: search,
          onClear: handleClear,
          child: MediaTypePicker(
            onSelect: handleOnSelected,
            filter: filter.value.mediaType,
          ),
        ),
      );
    }

    // DISPLAY OPTION
    showDisplayOptionPicker() {
      handleOnSelect(Map<DisplayOption, bool> value) {
        final filterText = <String>[];

        value.forEach((key, value) {
          switch (key) {
            case DisplayOption.notInAlbum:
              filter.value = filter.value.copyWith(
                display: filter.value.display.copyWith(
                  isNotInAlbum: value,
                ),
              );
              if (value) {
                filterText
                    .add('search_filter_display_option_not_in_album'.tr());
              }
              break;
            case DisplayOption.archive:
              filter.value = filter.value.copyWith(
                display: filter.value.display.copyWith(
                  isArchive: value,
                ),
              );
              if (value) {
                filterText.add('search_filter_display_option_archive'.tr());
              }
              break;
            case DisplayOption.favorite:
              filter.value = filter.value.copyWith(
                display: filter.value.display.copyWith(
                  isFavorite: value,
                ),
              );
              if (value) {
                filterText.add('search_filter_display_option_favorite'.tr());
              }
              break;
          }
        });

        displayOptionCurrentFilterWidget.value = Text(
          filterText.join(', '),
          style: context.textTheme.labelLarge,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(
          display: SearchDisplayFilters(
            isNotInAlbum: false,
            isArchive: false,
            isFavorite: false,
          ),
        );

        displayOptionCurrentFilterWidget.value = null;
        search();
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_display_options_title'.tr(),
          onSearch: search,
          onClear: handleClear,
          child: DisplayOptionPicker(
            onSelect: handleOnSelect,
            filter: filter.value.display,
          ),
        ),
      );
    }

    handleTextSubmitted(String value) {
      if (value.isEmpty) {
        return;
      }

      if (isContextualSearch.value) {
        filter.value = filter.value.copyWith(
          context: value,
          filename: null,
        );
      } else {
        filter.value = filter.value.copyWith(filename: value, context: null);
      }

      search();
    }

    buildSearchResult() {
      return switch (searchProvider) {
        AsyncData() => Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: NotificationListener<ScrollEndNotification>(
                onNotification: (notification) {
                  final metrics = notification.metrics;
                  final shouldLoadMore = searchResultCount.value > 75;
                  if (metrics.pixels >= metrics.maxScrollExtent &&
                      shouldLoadMore) {
                    loadMoreSearchResult();
                  }
                  return true;
                },
                child: MultiselectGrid(
                  renderListProvider: paginatedSearchRenderListProvider,
                  archiveEnabled: true,
                  deleteEnabled: true,
                  editEnabled: true,
                  favoriteEnabled: true,
                  stackEnabled: false,
                  emptyIndicator: const SizedBox(),
                ),
              ),
            ),
          ),
        AsyncError(:final error) => Text('Error: $error'),
        _ => const Expanded(child: Center(child: CircularProgressIndicator())),
      };
    }

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        automaticallyImplyLeading: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14.0),
            child: IconButton(
              icon: isContextualSearch.value
                  ? const Icon(Icons.abc_rounded)
                  : const Icon(Icons.image_search_rounded),
              onPressed: () {
                isContextualSearch.value = !isContextualSearch.value;
                textSearchController.clear();
              },
            ),
          ),
        ],
        title: Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: context.colorScheme.onSurface.withAlpha(0),
              width: 0,
            ),
            borderRadius: BorderRadius.circular(24),
            gradient: LinearGradient(
              colors: [
                context.colorScheme.primary.withOpacity(0.075),
                context.colorScheme.primary.withOpacity(0.09),
                context.colorScheme.primary.withOpacity(0.075),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: TextField(
            controller: textSearchController,
            decoration: InputDecoration(
              contentPadding: EdgeInsets.all(8),
              prefixIcon: prefilter != null
                  ? null
                  : Icon(
                      Icons.search_rounded,
                      color: context.colorScheme.primary,
                    ),
              hintText: isContextualSearch.value
                  ? 'contextual_search'.tr()
                  : 'filename_search'.tr(),
              hintStyle: context.textTheme.bodyLarge?.copyWith(
                color: context.themeData.colorScheme.onSurfaceSecondary,
                fontWeight: FontWeight.w500,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(25),
                borderSide: BorderSide(
                  color: context.colorScheme.surfaceDim,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(25),
                borderSide: BorderSide(
                  color: context.colorScheme.surfaceContainer,
                ),
              ),
              disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(25),
                borderSide: BorderSide(
                  color: context.colorScheme.surfaceDim,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(25),
                borderSide: BorderSide(
                  color: context.colorScheme.primary.withAlpha(100),
                ),
              ),
            ),
            onSubmitted: handleTextSubmitted,
            focusNode: focusNode,
            onTapOutside: (_) => focusNode.unfocus(),
          ),
        ),
      ),
      body: Column(
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
                    label: 'search_filter_people'.tr(),
                    currentFilter: peopleCurrentFilterWidget.value,
                  ),
                  SearchFilterChip(
                    icon: Icons.location_pin,
                    onTap: showLocationPicker,
                    label: 'search_filter_location'.tr(),
                    currentFilter: locationCurrentFilterWidget.value,
                  ),
                  SearchFilterChip(
                    icon: Icons.camera_alt_rounded,
                    onTap: showCameraPicker,
                    label: 'search_filter_camera'.tr(),
                    currentFilter: cameraCurrentFilterWidget.value,
                  ),
                  SearchFilterChip(
                    icon: Icons.date_range_rounded,
                    onTap: showDatePicker,
                    label: 'search_filter_date'.tr(),
                    currentFilter: dateRangeCurrentFilterWidget.value,
                  ),
                  SearchFilterChip(
                    icon: Icons.video_collection_outlined,
                    onTap: showMediaTypePicker,
                    label: 'search_filter_media_type'.tr(),
                    currentFilter: mediaTypeCurrentFilterWidget.value,
                  ),
                  SearchFilterChip(
                    icon: Icons.display_settings_outlined,
                    onTap: showDisplayOptionPicker,
                    label: 'search_filter_display_options'.tr(),
                    currentFilter: displayOptionCurrentFilterWidget.value,
                  ),
                ],
              ),
            ),
          ),
          buildSearchResult(),
        ],
      ),
    );
  }
}
