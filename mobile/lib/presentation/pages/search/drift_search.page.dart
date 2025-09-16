import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/general_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:immich_mobile/widgets/search/search_filter/camera_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/display_option_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/location_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/media_type_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/people_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';

@RoutePage()
class DriftSearchPage extends HookConsumerWidget {
  const DriftSearchPage({super.key, this.preFilter});

  final SearchFilter? preFilter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textSearchType = useState<TextSearchType>(TextSearchType.context);
    final searchHintText = useState<String>('sunrise_on_the_beach'.t(context: context));
    final textSearchController = useTextEditingController();
    final filter = useState<SearchFilter>(
      SearchFilter(
        people: preFilter?.people ?? {},
        location: preFilter?.location ?? SearchLocationFilter(),
        camera: preFilter?.camera ?? SearchCameraFilter(),
        date: preFilter?.date ?? SearchDateFilter(),
        display: preFilter?.display ?? SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
        mediaType: preFilter?.mediaType ?? AssetType.other,
        language: "${context.locale.languageCode}-${context.locale.countryCode}",
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
        content: Text(message, style: context.textTheme.labelLarge),
        showCloseIcon: true,
        behavior: SnackBarBehavior.fixed,
        closeIconColor: context.colorScheme.onSurface,
      );
    }

    search() async {
      if (filter.value.isEmpty) {
        return;
      }

      if (preFilter == null && filter.value == previousFilter.value) {
        return;
      }

      isSearching.value = true;
      ref.watch(paginatedSearchProvider.notifier).clear();
      final hasResult = await ref.watch(paginatedSearchProvider.notifier).search(filter.value);

      if (!hasResult) {
        context.showSnackBar(searchInfoSnackBar('search_no_result'.t(context: context)));
      }

      previousFilter.value = filter.value;
      isSearching.value = false;
    }

    loadMoreSearchResult() async {
      isSearching.value = true;
      final hasResult = await ref.watch(paginatedSearchProvider.notifier).search(filter.value);

      if (!hasResult) {
        context.showSnackBar(searchInfoSnackBar('search_no_more_result'.t(context: context)));
      }

      isSearching.value = false;
    }

    searchPreFilter() {
      if (preFilter != null) {
        Future.delayed(Duration.zero, () {
          search();

          if (preFilter!.location.city != null) {
            locationCurrentFilterWidget.value = Text(preFilter!.location.city!, style: context.textTheme.labelLarge);
          }
        });
      }
    }

    useEffect(() {
      Future.microtask(() => ref.invalidate(paginatedSearchProvider));
      searchPreFilter();

      return null;
    }, []);

    showPeoplePicker() {
      handleOnSelect(Set<PersonDto> value) {
        filter.value = filter.value.copyWith(people: value);

        peopleCurrentFilterWidget.value = Text(
          value.map((e) => e.name != '' ? e.name : 'no_name'.t(context: context)).join(', '),
          style: context.textTheme.labelLarge,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(people: {});

        peopleCurrentFilterWidget.value = null;
        search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        child: FractionallySizedBox(
          heightFactor: 0.8,
          child: FilterBottomSheetScaffold(
            title: 'search_filter_people_title'.t(context: context),
            expanded: true,
            onSearch: search,
            onClear: handleClear,
            child: PeoplePicker(onSelect: handleOnSelect, filter: filter.value.people),
          ),
        ),
      );
    }

    showLocationPicker() {
      handleOnSelect(Map<String, String?> value) {
        filter.value = filter.value.copyWith(
          location: SearchLocationFilter(country: value['country'], city: value['city'], state: value['state']),
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

        locationCurrentFilterWidget.value = Text(locationText.join(', '), style: context.textTheme.labelLarge);
      }

      handleClear() {
        filter.value = filter.value.copyWith(location: SearchLocationFilter());

        locationCurrentFilterWidget.value = null;
        search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: true,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_location_title'.t(context: context),
          onSearch: search,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: Container(
              padding: EdgeInsets.only(bottom: context.viewInsets.bottom),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: LocationPicker(onSelected: handleOnSelect, filter: filter.value.location),
              ),
            ),
          ),
        ),
      );
    }

    showCameraPicker() {
      handleOnSelect(Map<String, String?> value) {
        filter.value = filter.value.copyWith(
          camera: SearchCameraFilter(make: value['make'], model: value['model']),
        );

        cameraCurrentFilterWidget.value = Text(
          '${value['make'] ?? ''} ${value['model'] ?? ''}',
          style: context.textTheme.labelLarge,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(camera: SearchCameraFilter());

        cameraCurrentFilterWidget.value = null;
        search();
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: true,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_camera_title'.t(context: context),
          onSearch: search,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: CameraPicker(onSelect: handleOnSelect, filter: filter.value.camera),
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
        helpText: 'search_filter_date_title'.t(context: context),
        cancelText: 'cancel'.t(context: context),
        confirmText: 'select'.t(context: context),
        saveText: 'save'.t(context: context),
        errorFormatText: 'invalid_date_format'.t(context: context),
        errorInvalidText: 'invalid_date'.t(context: context),
        fieldStartHintText: 'start_date'.t(context: context),
        fieldEndHintText: 'end_date'.t(context: context),
        initialEntryMode: DatePickerEntryMode.calendar,
        keyboardType: TextInputType.text,
      );

      if (date == null) {
        filter.value = filter.value.copyWith(date: SearchDateFilter());

        dateRangeCurrentFilterWidget.value = null;
        search();
        return;
      }

      filter.value = filter.value.copyWith(
        date: SearchDateFilter(
          takenAfter: date.start,
          takenBefore: date.end.add(const Duration(hours: 23, minutes: 59, seconds: 59)),
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
          'search_filter_date_interval'.t(
            context: context,
            args: {
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
        filter.value = filter.value.copyWith(mediaType: assetType);

        mediaTypeCurrentFilterWidget.value = Text(
          assetType == AssetType.image
              ? 'image'.t(context: context)
              : assetType == AssetType.video
              ? 'video'.t(context: context)
              : 'all'.t(context: context),
          style: context.textTheme.labelLarge,
        );
      }

      handleClear() {
        filter.value = filter.value.copyWith(mediaType: AssetType.other);

        mediaTypeCurrentFilterWidget.value = null;
        search();
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_media_type_title'.t(context: context),
          onSearch: search,
          onClear: handleClear,
          child: MediaTypePicker(onSelect: handleOnSelected, filter: filter.value.mediaType),
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
              filter.value = filter.value.copyWith(display: filter.value.display.copyWith(isNotInAlbum: value));
              if (value) {
                filterText.add('search_filter_display_option_not_in_album'.t(context: context));
              }
              break;
            case DisplayOption.archive:
              filter.value = filter.value.copyWith(display: filter.value.display.copyWith(isArchive: value));
              if (value) {
                filterText.add('archive'.t(context: context));
              }
              break;
            case DisplayOption.favorite:
              filter.value = filter.value.copyWith(display: filter.value.display.copyWith(isFavorite: value));
              if (value) {
                filterText.add('favorite'.t(context: context));
              }
              break;
          }
        });

        if (filterText.isEmpty) {
          displayOptionCurrentFilterWidget.value = null;
          return;
        }

        displayOptionCurrentFilterWidget.value = Text(filterText.join(', '), style: context.textTheme.labelLarge);
      }

      handleClear() {
        filter.value = filter.value.copyWith(
          display: SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
        );

        displayOptionCurrentFilterWidget.value = null;
        search();
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'display_options'.t(context: context),
          onSearch: search,
          onClear: handleClear,
          child: DisplayOptionPicker(onSelect: handleOnSelect, filter: filter.value.display),
        ),
      );
    }

    handleTextSubmitted(String value) {
      switch (textSearchType.value) {
        case TextSearchType.context:
          filter.value = filter.value.copyWith(filename: '', context: value, description: '');

          break;
        case TextSearchType.filename:
          filter.value = filter.value.copyWith(filename: value, context: '', description: '');

          break;
        case TextSearchType.description:
          filter.value = filter.value.copyWith(filename: '', context: '', description: value);
          break;
      }

      search();
    }

    IconData getSearchPrefixIcon() => switch (textSearchType.value) {
      TextSearchType.context => Icons.image_search_rounded,
      TextSearchType.filename => Icons.abc_rounded,
      TextSearchType.description => Icons.text_snippet_outlined,
    };

    return Scaffold(
      resizeToAvoidBottomInset: false,
      appBar: AppBar(
        automaticallyImplyLeading: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: MenuAnchor(
              style: MenuStyle(
                elevation: const WidgetStatePropertyAll(1),
                shape: WidgetStateProperty.all(
                  const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(24))),
                ),
                padding: const WidgetStatePropertyAll(EdgeInsets.all(4)),
              ),
              builder: (BuildContext context, MenuController controller, Widget? child) {
                return IconButton(
                  onPressed: () {
                    if (controller.isOpen) {
                      controller.close();
                    } else {
                      controller.open();
                    }
                  },
                  icon: const Icon(Icons.more_vert_rounded),
                  tooltip: 'show_text_search_menu'.tr(),
                );
              },
              menuChildren: [
                MenuItemButton(
                  child: ListTile(
                    leading: const Icon(Icons.image_search_rounded),
                    title: Text(
                      'search_by_context'.t(context: context),
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: textSearchType.value == TextSearchType.context ? context.colorScheme.primary : null,
                      ),
                    ),
                    selectedColor: context.colorScheme.primary,
                    selected: textSearchType.value == TextSearchType.context,
                  ),
                  onPressed: () {
                    textSearchType.value = TextSearchType.context;
                    searchHintText.value = 'sunrise_on_the_beach'.t(context: context);
                  },
                ),
                MenuItemButton(
                  child: ListTile(
                    leading: const Icon(Icons.abc_rounded),
                    title: Text(
                      'search_filter_filename'.t(context: context),
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: textSearchType.value == TextSearchType.filename ? context.colorScheme.primary : null,
                      ),
                    ),
                    selectedColor: context.colorScheme.primary,
                    selected: textSearchType.value == TextSearchType.filename,
                  ),
                  onPressed: () {
                    textSearchType.value = TextSearchType.filename;
                    searchHintText.value = 'file_name_or_extension'.t(context: context);
                  },
                ),
                MenuItemButton(
                  child: ListTile(
                    leading: const Icon(Icons.text_snippet_outlined),
                    title: Text(
                      'search_by_description'.t(context: context),
                      style: context.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                        color: textSearchType.value == TextSearchType.description ? context.colorScheme.primary : null,
                      ),
                    ),
                    selectedColor: context.colorScheme.primary,
                    selected: textSearchType.value == TextSearchType.description,
                  ),
                  onPressed: () {
                    textSearchType.value = TextSearchType.description;
                    searchHintText.value = 'search_by_description_example'.t(context: context);
                  },
                ),
              ],
            ),
          ),
        ],
        title: Container(
          decoration: BoxDecoration(
            border: Border.all(color: context.colorScheme.onSurface.withAlpha(0), width: 0),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
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
          child: SearchField(
            hintText: searchHintText.value,
            key: const Key('search_text_field'),
            controller: textSearchController,
            contentPadding: preFilter != null ? const EdgeInsets.only(left: 24) : const EdgeInsets.all(8),
            prefixIcon: preFilter != null ? null : Icon(getSearchPrefixIcon(), color: context.colorScheme.primary),
            onSubmitted: handleTextSubmitted,
            focusNode: ref.watch(searchInputFocusProvider),
          ),
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.only(top: 12.0, bottom: 4.0),
            sliver: SliverToBoxAdapter(
              child: SizedBox(
                height: 50,
                child: ListView(
                  key: const Key('search_filter_chip_list'),
                  shrinkWrap: true,
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    SearchFilterChip(
                      icon: Icons.people_alt_outlined,
                      onTap: showPeoplePicker,
                      label: 'people'.t(context: context),
                      currentFilter: peopleCurrentFilterWidget.value,
                    ),
                    SearchFilterChip(
                      icon: Icons.location_on_outlined,
                      onTap: showLocationPicker,
                      label: 'search_filter_location'.t(context: context),
                      currentFilter: locationCurrentFilterWidget.value,
                    ),
                    SearchFilterChip(
                      icon: Icons.camera_alt_outlined,
                      onTap: showCameraPicker,
                      label: 'camera'.t(context: context),
                      currentFilter: cameraCurrentFilterWidget.value,
                    ),
                    SearchFilterChip(
                      icon: Icons.date_range_outlined,
                      onTap: showDatePicker,
                      label: 'search_filter_date'.t(context: context),
                      currentFilter: dateRangeCurrentFilterWidget.value,
                    ),
                    SearchFilterChip(
                      key: const Key('media_type_chip'),
                      icon: Icons.video_collection_outlined,
                      onTap: showMediaTypePicker,
                      label: 'search_filter_media_type'.t(context: context),
                      currentFilter: mediaTypeCurrentFilterWidget.value,
                    ),
                    SearchFilterChip(
                      icon: Icons.display_settings_outlined,
                      onTap: showDisplayOptionPicker,
                      label: 'search_filter_display_options'.t(context: context),
                      currentFilter: displayOptionCurrentFilterWidget.value,
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (isSearching.value)
            const SliverFillRemaining(hasScrollBody: false, child: Center(child: CircularProgressIndicator()))
          else
            _SearchResultGrid(onScrollEnd: loadMoreSearchResult),
        ],
      ),
    );
  }
}

class _SearchResultGrid extends ConsumerWidget {
  final VoidCallback onScrollEnd;

  const _SearchResultGrid({required this.onScrollEnd});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchResult = ref.watch(paginatedSearchProvider);

    if (searchResult.totalAssets == 0) {
      return const _SearchEmptyContent();
    }

    return NotificationListener<ScrollEndNotification>(
      onNotification: (notification) {
        final isBottomSheetNotification =
            notification.context?.findAncestorWidgetOfExactType<DraggableScrollableSheet>() != null;

        final metrics = notification.metrics;
        final isVerticalScroll = metrics.axis == Axis.vertical;

        if (metrics.pixels >= metrics.maxScrollExtent && isVerticalScroll && !isBottomSheetNotification) {
          onScrollEnd();
        }

        return true;
      },
      child: SliverFillRemaining(
        child: ProviderScope(
          overrides: [
            timelineServiceProvider.overrideWith((ref) {
              final timelineService = ref.watch(timelineFactoryProvider).fromAssets(searchResult.assets);
              ref.onDispose(timelineService.dispose);
              return timelineService;
            }),
          ],
          child: Timeline(
            key: ValueKey(searchResult.totalAssets),
            groupBy: GroupAssetsBy.none,
            appBar: null,
            bottomSheet: const GeneralBottomSheet(minChildSize: 0.20),
            withScrubber: false,
          ),
        ),
      ),
    );
  }
}

class _SearchEmptyContent extends StatelessWidget {
  const _SearchEmptyContent();

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: ListView(
        shrinkWrap: true,
        children: [
          const SizedBox(height: 40),
          Center(
            child: Image.asset(
              context.isDarkTheme ? 'assets/polaroid-dark.png' : 'assets/polaroid-light.png',
              height: 125,
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text('search_page_search_photos_videos'.t(context: context), style: context.textTheme.labelLarge),
          ),
          const SizedBox(height: 32),
          const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: _QuickLinkList()),
        ],
      ),
    );
  }
}

class _QuickLinkList extends StatelessWidget {
  const _QuickLinkList();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        border: Border.all(color: context.colorScheme.outline.withAlpha(10), width: 1),
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
          _QuickLink(
            title: 'recently_taken'.t(context: context),
            icon: Icons.schedule_outlined,
            isTop: true,
            onTap: () => context.pushRoute(const DriftRecentlyTakenRoute()),
          ),
          _QuickLink(
            title: 'videos'.t(context: context),
            icon: Icons.play_circle_outline_rounded,
            onTap: () => context.pushRoute(const DriftVideoRoute()),
          ),
          _QuickLink(
            title: 'favorites'.t(context: context),
            icon: Icons.favorite_border_rounded,
            isBottom: true,
            onTap: () => context.pushRoute(const DriftFavoriteRoute()),
          ),
        ],
      ),
    );
  }
}

class _QuickLink extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;
  final bool isTop;
  final bool isBottom;

  const _QuickLink({
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
      shape: RoundedRectangleBorder(borderRadius: borderRadius),
      leading: Icon(icon, size: 26),
      title: Text(title, style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
      onTap: onTap,
    );
  }
}
