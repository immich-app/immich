import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/providers/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/routing/router.dart';
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
class SearchPage extends HookConsumerWidget {
  const SearchPage({super.key, this.prefilter});

  final SearchFilter? prefilter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textSearchType = useState<TextSearchType>(TextSearchType.context);
    final searchHintText = useState<String>('contextual_search'.tr());
    final textSearchController = useTextEditingController();
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

    final previousFilter = useState<SearchFilter?>(null);

    final peopleCurrentFilterWidget = useState<Widget?>(null);
    final dateRangeCurrentFilterWidget = useState<Widget?>(null);
    final cameraCurrentFilterWidget = useState<Widget?>(null);
    final locationCurrentFilterWidget = useState<Widget?>(null);
    final mediaTypeCurrentFilterWidget = useState<Widget?>(null);
    final displayOptionCurrentFilterWidget = useState<Widget?>(null);

    final isSearching = useState(false);

    SnackBar searchInfoSnackBar(String message) {
      return SnackBar(
        content: Text(
          message,
          style: context.textTheme.labelLarge,
        ),
        showCloseIcon: true,
        behavior: SnackBarBehavior.fixed,
        closeIconColor: context.colorScheme.onSurface,
      );
    }

    search() async {
      if (filter.value.isEmpty) {
        return;
      }

      if (prefilter == null && filter.value == previousFilter.value) {
        return;
      }

      isSearching.value = true;
      ref.watch(paginatedSearchProvider.notifier).clear();
      final hasResult = await ref
          .watch(paginatedSearchProvider.notifier)
          .search(filter.value);

      if (!hasResult) {
        context.showSnackBar(
          searchInfoSnackBar('search_no_result'.tr()),
        );
      }

      previousFilter.value = filter.value;
      isSearching.value = false;
    }

    loadMoreSearchResult() async {
      isSearching.value = true;
      final hasResult = await ref
          .watch(paginatedSearchProvider.notifier)
          .search(filter.value);

      if (!hasResult) {
        context.showSnackBar(
          searchInfoSnackBar('search_no_more_result'.tr()),
        );
      }

      isSearching.value = false;
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
        Future.microtask(
          () => ref.invalidate(paginatedSearchProvider),
        );
        searchPrefilter();

        return null;
      },
      [],
    );

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
        isDismissible: true,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_location_title'.tr(),
          onSearch: search,
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
        isDismissible: true,
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
        initialEntryMode: DatePickerEntryMode.calendar,
        keyboardType: TextInputType.text,
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

        if (filterText.isEmpty) {
          displayOptionCurrentFilterWidget.value = null;
          return;
        }

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
      switch (textSearchType.value) {
        case TextSearchType.context:
          filter.value = filter.value.copyWith(
            filename: '',
            context: value,
            description: '',
          );

          break;
        case TextSearchType.filename:
          filter.value = filter.value.copyWith(
            filename: value,
            context: '',
            description: '',
          );

          break;
        case TextSearchType.description:
          filter.value = filter.value.copyWith(
            filename: '',
            context: '',
            description: value,
          );
          break;
      }

      search();
    }

    IconData getSearchPrefixIcon() {
      switch (textSearchType.value) {
        case TextSearchType.context:
          return Icons.image_search_rounded;
        case TextSearchType.filename:
          return Icons.abc_rounded;
        case TextSearchType.description:
          return Icons.text_snippet_outlined;
      }
    }

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        automaticallyImplyLeading: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: MenuAnchor(
              style: MenuStyle(
                elevation: const WidgetStatePropertyAll(1),
                shape: WidgetStateProperty.all(
                  RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                ),
                padding: const WidgetStatePropertyAll(
                  EdgeInsets.all(4),
                ),
              ),
              builder: (
                BuildContext context,
                MenuController controller,
                Widget? child,
              ) {
                return IconButton(
                  onPressed: () {
                    if (controller.isOpen) {
                      controller.close();
                    } else {
                      controller.open();
                    }
                  },
                  icon: const Icon(Icons.more_vert_rounded),
                  tooltip: 'Show text search menu',
                );
              },
              menuChildren: [
                MenuItemButton(
                  child: ListTile(
                    leading: const Icon(Icons.image_search_rounded),
                    title: Text(
                      'search_filter_contextual'.tr(),
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: textSearchType.value == TextSearchType.context
                            ? context.colorScheme.primary
                            : null,
                      ),
                    ),
                    selectedColor: context.colorScheme.primary,
                    selected: textSearchType.value == TextSearchType.context,
                  ),
                  onPressed: () {
                    textSearchType.value = TextSearchType.context;
                    searchHintText.value = 'contextual_search'.tr();
                  },
                ),
                MenuItemButton(
                  child: ListTile(
                    leading: const Icon(Icons.abc_rounded),
                    title: Text(
                      'search_filter_filename'.tr(),
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: textSearchType.value == TextSearchType.filename
                            ? context.colorScheme.primary
                            : null,
                      ),
                    ),
                    selectedColor: context.colorScheme.primary,
                    selected: textSearchType.value == TextSearchType.filename,
                  ),
                  onPressed: () {
                    textSearchType.value = TextSearchType.filename;
                    searchHintText.value = 'filename_search'.tr();
                  },
                ),
                MenuItemButton(
                  child: ListTile(
                    leading: const Icon(Icons.text_snippet_outlined),
                    title: Text(
                      'search_filter_description'.tr(),
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                        color:
                            textSearchType.value == TextSearchType.description
                                ? context.colorScheme.primary
                                : null,
                      ),
                    ),
                    selectedColor: context.colorScheme.primary,
                    selected:
                        textSearchType.value == TextSearchType.description,
                  ),
                  onPressed: () {
                    textSearchType.value = TextSearchType.description;
                    searchHintText.value = 'description_search'.tr();
                  },
                ),
              ],
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
                context.colorScheme.primary.withValues(alpha: 0.075),
                context.colorScheme.primary.withValues(alpha: 0.09),
                context.colorScheme.primary.withValues(alpha: 0.075),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: TextField(
            key: const Key('search_text_field'),
            controller: textSearchController,
            decoration: InputDecoration(
              contentPadding: prefilter != null
                  ? const EdgeInsets.only(left: 24)
                  : const EdgeInsets.all(8),
              prefixIcon: prefilter != null
                  ? null
                  : Icon(
                      getSearchPrefixIcon(),
                      color: context.colorScheme.primary,
                    ),
              hintText: searchHintText.value,
              hintStyle: context.textTheme.bodyLarge?.copyWith(
                color: context.themeData.colorScheme.onSurfaceSecondary,
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
            focusNode: ref.watch(searchInputFocusProvider),
            onTapOutside: (_) => ref.read(searchInputFocusProvider).unfocus(),
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
                key: const Key('search_filter_chip_list'),
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
                    key: const Key('media_type_chip'),
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
          if (isSearching.value)
            const Expanded(
              child: Center(child: CircularProgressIndicator.adaptive()),
            )
          else
            SearchResultGrid(
              onScrollEnd: loadMoreSearchResult,
              isSearching: isSearching.value,
            ),
        ],
      ),
    );
  }
}

class SearchResultGrid extends StatelessWidget {
  final VoidCallback onScrollEnd;
  final bool isSearching;

  const SearchResultGrid({
    super.key,
    required this.onScrollEnd,
    this.isSearching = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(top: 8.0),
        child: NotificationListener<ScrollEndNotification>(
          onNotification: (notification) {
            final isBottomSheetNotification = notification.context
                    ?.findAncestorWidgetOfExactType<
                        DraggableScrollableSheet>() !=
                null;

            final metrics = notification.metrics;
            final isVerticalScroll = metrics.axis == Axis.vertical;

            if (metrics.pixels >= metrics.maxScrollExtent &&
                isVerticalScroll &&
                !isBottomSheetNotification) {
              onScrollEnd();
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
            emptyIndicator: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: !isSearching
                  ? const SearchEmptyContent()
                  : const SizedBox.shrink(),
            ),
          ),
        ),
      ),
    );
  }
}

class SearchEmptyContent extends StatelessWidget {
  const SearchEmptyContent({super.key});

  @override
  Widget build(BuildContext context) {
    return NotificationListener<ScrollNotification>(
      onNotification: (_) => true,
      child: ListView(
        shrinkWrap: false,
        children: [
          const SizedBox(height: 40),
          Center(
            child: Image.asset(
              context.isDarkTheme
                  ? 'assets/polaroid-dark.png'
                  : 'assets/polaroid-light.png',
              height: 125,
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'search_page_search_photos_videos'.tr(),
              style: context.textTheme.labelLarge,
            ),
          ),
          const SizedBox(height: 32),
          const QuickLinkList(),
        ],
      ),
    );
  }
}

class QuickLinkList extends StatelessWidget {
  const QuickLinkList({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: context.colorScheme.outline.withAlpha(10),
          width: 1,
        ),
        gradient: LinearGradient(
          colors: [
            context.colorScheme.primary.withAlpha(10),
            context.colorScheme.primary.withAlpha(15),
            context.colorScheme.primary.withAlpha(20),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: ListView(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          QuickLink(
            title: 'recently_added'.tr(),
            icon: Icons.schedule_outlined,
            isTop: true,
            onTap: () => context.pushRoute(const RecentlyAddedRoute()),
          ),
          QuickLink(
            title: 'videos'.tr(),
            icon: Icons.play_circle_outline_rounded,
            onTap: () => context.pushRoute(const AllVideosRoute()),
          ),
          QuickLink(
            title: 'favorites'.tr(),
            icon: Icons.favorite_border_rounded,
            isBottom: true,
            onTap: () => context.pushRoute(const FavoritesRoute()),
          ),
        ],
      ),
    );
  }
}

class QuickLink extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;
  final bool isTop;
  final bool isBottom;

  const QuickLink({
    super.key,
    required this.title,
    required this.icon,
    required this.onTap,
    this.isTop = false,
    this.isBottom = false,
  });

  @override
  Widget build(BuildContext context) {
    final borderRadius = BorderRadius.only(
      topLeft: Radius.circular(isTop ? 20 : 0),
      topRight: Radius.circular(isTop ? 20 : 0),
      bottomLeft: Radius.circular(isBottom ? 20 : 0),
      bottomRight: Radius.circular(isBottom ? 20 : 0),
    );

    return ListTile(
      shape: RoundedRectangleBorder(
        borderRadius: borderRadius,
      ),
      leading: Icon(
        icon,
        size: 26,
      ),
      title: Text(
        title,
        style: context.textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }
}
