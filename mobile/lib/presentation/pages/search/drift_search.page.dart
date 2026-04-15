import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/general_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/search/quick_date_picker.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/feature_check.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:immich_mobile/widgets/common/tag_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/camera_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/display_option_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/filter_bottom_sheet_scaffold.dart';
import 'package:immich_mobile/widgets/search/search_filter/location_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/media_type_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/people_picker.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_chip.dart';
import 'package:immich_mobile/widgets/search/search_filter/search_filter_utils.dart';
import 'package:immich_mobile/widgets/search/search_filter/star_rating_picker.dart';

@RoutePage()
class DriftSearchPage extends HookConsumerWidget {
  const DriftSearchPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final serverFeatures = ref.watch(serverInfoProvider.select((v) => v.serverFeatures));
    final textSearchType = useState<TextSearchType>(
      serverFeatures.smartSearch ? TextSearchType.context : TextSearchType.filename,
    );
    final searchHintText = useState<String>(
      serverFeatures.smartSearch
          ? 'sunrise_on_the_beach'.t(context: context)
          : 'file_name_or_extension'.t(context: context),
    );
    final textSearchController = useTextEditingController();
    final filter = useState<SearchFilter>(
      SearchFilter(
        people: {},
        location: SearchLocationFilter(),
        camera: SearchCameraFilter(),
        date: SearchDateFilter(),
        display: SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
        rating: SearchRatingFilter(),
        mediaType: AssetType.other,
        language: "${context.locale.languageCode}-${context.locale.countryCode}",
        tagIds: [],
      ),
    );

    final dateInputFilter = useState<DateFilterInputModel?>(null);

    final peopleCurrentFilterWidget = useState<Widget?>(null);
    final dateRangeCurrentFilterWidget = useState<Widget?>(null);
    final cameraCurrentFilterWidget = useState<Widget?>(null);
    final locationCurrentFilterWidget = useState<Widget?>(null);
    final tagCurrentFilterWidget = useState<Widget?>(null);
    final mediaTypeCurrentFilterWidget = useState<Widget?>(null);
    final ratingCurrentFilterWidget = useState<Widget?>(null);
    final displayOptionCurrentFilterWidget = useState<Widget?>(null);

    final userPreferences = ref.watch(userMetadataPreferencesProvider);

    search(SearchFilter f) {
      if (f == filter.value) {
        return;
      }

      filter.value = f;

      ref.read(paginatedSearchProvider.notifier).clear();

      if (!f.isEmpty) {
        unawaited(ref.read(paginatedSearchProvider.notifier).search(f));
      }
    }

    loadMoreSearchResults() {
      unawaited(ref.read(paginatedSearchProvider.notifier).search(filter.value));
    }

    // TODO: Use ref.listen with `fireImmediately` in the new riverpod version.
    final preFilter = ref.watch(searchPreFilterProvider);
    useEffect(() {
      if (preFilter == null) {
        return null;
      }

      Future.microtask(() {
        textSearchController.clear();
        search(preFilter);
        if (preFilter.location.city != null) {
          locationCurrentFilterWidget.value = Text(preFilter.location.city!, style: context.textTheme.labelLarge);
        }
      });

      return null;
    }, [preFilter]);

    showPeoplePicker() {
      var people = filter.value.people;

      handleOnSelect(Set<PersonDto> value) {
        people = value;
      }

      handleClear() {
        peopleCurrentFilterWidget.value = null;
        search(filter.value.copyWith(people: {}));
      }

      handleApply() {
        final label = people.map((e) => e.name != '' ? e.name : 'no_name'.t(context: context)).join(', ');
        peopleCurrentFilterWidget.value = label.isNotEmpty ? Text(label, style: context.textTheme.labelLarge) : null;
        search(filter.value.copyWith(people: people));
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        child: FractionallySizedBox(
          heightFactor: 0.8,
          child: FilterBottomSheetScaffold(
            title: 'search_filter_people_title'.t(context: context),
            expanded: true,
            onSearch: handleApply,
            onClear: handleClear,
            child: PeoplePicker(onSelect: handleOnSelect, filter: filter.value.people),
          ),
        ),
      );
    }

    showTagPicker() {
      var tagIds = filter.value.tagIds ?? [];
      String tagLabel = '';

      handleOnSelect(Iterable<Tag> tags) {
        tagIds = tags.map((t) => t.id).toList();
        tagLabel = tags.map((t) => t.value).join(', ');
      }

      handleClear() {
        tagCurrentFilterWidget.value = null;
        search(filter.value.copyWith(tagIds: []));
      }

      handleApply() {
        tagCurrentFilterWidget.value = tagLabel.isNotEmpty ? Text(tagLabel, style: context.textTheme.labelLarge) : null;
        search(filter.value.copyWith(tagIds: tagIds));
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        child: FractionallySizedBox(
          heightFactor: 0.8,
          child: FilterBottomSheetScaffold(
            title: 'search_filter_tags_title'.t(context: context),
            expanded: true,
            onSearch: handleApply,
            onClear: handleClear,
            child: TagPicker(onSelect: handleOnSelect, filter: (filter.value.tagIds ?? []).toSet()),
          ),
        ),
      );
    }

    showLocationPicker() {
      var location = filter.value.location;

      handleOnSelect(Map<String, String?> value) {
        location = SearchLocationFilter(country: value['country'], city: value['city'], state: value['state']);
      }

      handleClear() {
        locationCurrentFilterWidget.value = null;
        search(filter.value.copyWith(location: SearchLocationFilter()));
      }

      handleApply() {
        final locationText = [
          if (location.country != null) location.country!,
          if (location.state != null) location.state!,
          if (location.city != null) location.city!,
        ];
        locationCurrentFilterWidget.value = locationText.isNotEmpty
            ? Text(locationText.join(', '), style: context.textTheme.labelLarge)
            : null;
        search(filter.value.copyWith(location: location));
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: true,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_location_title'.t(context: context),
          onSearch: handleApply,
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
      var camera = filter.value.camera;

      handleOnSelect(Map<String, String?> value) {
        camera = SearchCameraFilter(make: value['make'], model: value['model']);
      }

      handleClear() {
        cameraCurrentFilterWidget.value = null;
        search(filter.value.copyWith(camera: SearchCameraFilter()));
      }

      handleApply() {
        final make = camera.make ?? '';
        final model = camera.model ?? '';
        cameraCurrentFilterWidget.value = (make.isNotEmpty || model.isNotEmpty)
            ? Text('$make $model', style: context.textTheme.labelLarge)
            : null;
        search(filter.value.copyWith(camera: camera));
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        isDismissible: true,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_camera_title'.t(context: context),
          onSearch: handleApply,
          onClear: handleClear,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: CameraPicker(onSelect: handleOnSelect, filter: filter.value.camera),
          ),
        ),
      );
    }

    datePicked(DateFilterInputModel? selectedDate) {
      dateInputFilter.value = selectedDate;
      if (selectedDate == null) {
        dateRangeCurrentFilterWidget.value = null;
        search(filter.value.copyWith(date: SearchDateFilter()));
        return;
      }

      final date = selectedDate.asDateTimeRange();
      dateRangeCurrentFilterWidget.value = Text(
        selectedDate.asHumanReadable(context),
        style: context.textTheme.labelLarge,
      );
      search(
        filter.value.copyWith(
          date: SearchDateFilter(
            takenAfter: date.start,
            takenBefore: date.end.add(const Duration(hours: 23, minutes: 59, seconds: 59)),
          ),
        ),
      );
    }

    showDatePicker() async {
      final firstDate = DateTime(1900);
      final lastDate = DateTime.now();

      var dateRange = DateTimeRange(
        start: filter.value.date.takenAfter ?? lastDate,
        end: filter.value.date.takenBefore ?? lastDate,
      );

      // datePicked() may increase the date, this will make the date picker fail an assertion
      // Fixup the end date to be at most now.
      if (dateRange.end.isAfter(lastDate)) {
        dateRange = DateTimeRange(start: dateRange.start, end: lastDate);
      }

      final date = await showDateRangePicker(
        context: context,
        firstDate: firstDate,
        lastDate: lastDate,
        currentDate: DateTime.now(),
        initialDateRange: dateRange,
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
        datePicked(null);
      } else {
        datePicked(CustomDateFilter.fromRange(date));
      }
    }

    showQuickDatePicker() {
      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: "pick_date_range".tr(),
          expanded: true,
          onClear: () => datePicked(null),
          child: QuickDatePicker(
            currentInput: dateInputFilter.value,
            onRequestPicker: () {
              context.pop();
              showDatePicker();
            },
            onSelect: (date) {
              context.pop();
              datePicked(date);
            },
          ),
        ),
      );
    }

    // MEDIA PICKER
    showMediaTypePicker() {
      var mediaType = filter.value.mediaType;

      handleOnSelected(AssetType assetType) {
        mediaType = assetType;
      }

      handleClear() {
        mediaTypeCurrentFilterWidget.value = null;
        search(filter.value.copyWith(mediaType: AssetType.other));
      }

      handleApply() {
        mediaTypeCurrentFilterWidget.value = mediaType != AssetType.other
            ? Text(
                mediaType == AssetType.image ? 'image'.t(context: context) : 'video'.t(context: context),
                style: context.textTheme.labelLarge,
              )
            : null;
        search(filter.value.copyWith(mediaType: mediaType));
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'search_filter_media_type_title'.t(context: context),
          onSearch: handleApply,
          onClear: handleClear,
          child: MediaTypePicker(onSelect: handleOnSelected, filter: filter.value.mediaType),
        ),
      );
    }

    // STAR RATING PICKER
    showStarRatingPicker() {
      var rating = filter.value.rating;

      handleOnSelected(SearchRatingFilter value) {
        rating = value;
      }

      handleClear() {
        ratingCurrentFilterWidget.value = null;
        search(filter.value.copyWith(rating: SearchRatingFilter(rating: null)));
      }

      handleApply() {
        ratingCurrentFilterWidget.value = rating.rating != null
            ? Text('rating_count'.t(args: {'count': rating.rating!}), style: context.textTheme.labelLarge)
            : null;
        search(filter.value.copyWith(rating: rating));
      }

      showFilterBottomSheet(
        context: context,
        isScrollControlled: true,
        child: FilterBottomSheetScaffold(
          title: 'rating'.t(context: context),
          onSearch: handleApply,
          onClear: handleClear,
          child: StarRatingPicker(onSelect: handleOnSelected, filter: filter.value.rating),
        ),
      );
    }

    // DISPLAY OPTION
    showDisplayOptionPicker() {
      var display = filter.value.display;

      handleOnSelect(Map<DisplayOption, bool> value) {
        display = display.copyWith(
          isNotInAlbum: value[DisplayOption.notInAlbum],
          isArchive: value[DisplayOption.archive],
          isFavorite: value[DisplayOption.favorite],
        );
      }

      handleClear() {
        displayOptionCurrentFilterWidget.value = null;
        search(
          filter.value.copyWith(
            display: SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
          ),
        );
      }

      handleApply() {
        final filterText = [
          if (display.isNotInAlbum) 'search_filter_display_option_not_in_album'.t(context: context),
          if (display.isArchive) 'archive'.t(context: context),
          if (display.isFavorite) 'favorite'.t(context: context),
        ];
        displayOptionCurrentFilterWidget.value = filterText.isNotEmpty
            ? Text(filterText.join(', '), style: context.textTheme.labelLarge)
            : null;
        search(filter.value.copyWith(display: display));
      }

      showFilterBottomSheet(
        context: context,
        child: FilterBottomSheetScaffold(
          title: 'display_options'.t(context: context),
          onSearch: handleApply,
          onClear: handleClear,
          child: DisplayOptionPicker(onSelect: handleOnSelect, filter: filter.value.display),
        ),
      );
    }

    handleTextSubmitted(String value) => search(switch (textSearchType.value) {
      TextSearchType.context => filter.value.copyWith(filename: '', context: value, description: '', ocr: ''),
      TextSearchType.filename => filter.value.copyWith(filename: value, context: '', description: '', ocr: ''),
      TextSearchType.description => filter.value.copyWith(filename: '', context: '', description: value, ocr: ''),
      TextSearchType.ocr => filter.value.copyWith(filename: '', context: '', description: '', ocr: value),
    });

    IconData getSearchPrefixIcon() => switch (textSearchType.value) {
      TextSearchType.context => Icons.image_search_rounded,
      TextSearchType.filename => Icons.abc_rounded,
      TextSearchType.description => Icons.text_snippet_outlined,
      TextSearchType.ocr => Icons.document_scanner_outlined,
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
                FeatureCheck(
                  feature: (features) => features.smartSearch,
                  child: MenuItemButton(
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
                FeatureCheck(
                  feature: (features) => features.ocr,
                  child: MenuItemButton(
                    child: ListTile(
                      leading: const Icon(Icons.document_scanner_outlined),
                      title: Text(
                        'search_by_ocr'.t(context: context),
                        style: context.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                          color: textSearchType.value == TextSearchType.ocr ? context.colorScheme.primary : null,
                        ),
                      ),
                      selectedColor: context.colorScheme.primary,
                      selected: textSearchType.value == TextSearchType.ocr,
                    ),
                    onPressed: () {
                      textSearchType.value = TextSearchType.ocr;
                      searchHintText.value = 'search_by_ocr_example'.t(context: context);
                    },
                  ),
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
            contentPadding: filter.value.assetId != null ? const EdgeInsets.only(left: 24) : const EdgeInsets.all(8),
            prefixIcon: filter.value.assetId != null
                ? null
                : Icon(getSearchPrefixIcon(), color: context.colorScheme.primary),
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
                    if (userPreferences.valueOrNull?.tagsEnabled ?? false)
                      SearchFilterChip(
                        icon: Icons.sell_outlined,
                        onTap: showTagPicker,
                        label: 'tags'.t(context: context),
                        currentFilter: tagCurrentFilterWidget.value,
                      ),
                    SearchFilterChip(
                      icon: Icons.camera_alt_outlined,
                      onTap: showCameraPicker,
                      label: 'camera'.t(context: context),
                      currentFilter: cameraCurrentFilterWidget.value,
                    ),
                    SearchFilterChip(
                      icon: Icons.date_range_outlined,
                      onTap: showQuickDatePicker,
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
                    if (userPreferences.valueOrNull?.ratingsEnabled ?? false)
                      SearchFilterChip(
                        icon: Icons.star_outline_rounded,
                        onTap: showStarRatingPicker,
                        label: 'search_filter_star_rating'.t(context: context),
                        currentFilter: ratingCurrentFilterWidget.value,
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
          if (filter.value.isEmpty)
            const _SearchSuggestions()
          else
            _SearchResultGrid(onScrollEnd: loadMoreSearchResults),
        ],
      ),
    );
  }
}

class _SearchResultGrid extends ConsumerWidget {
  final VoidCallback onScrollEnd;

  const _SearchResultGrid({required this.onScrollEnd});

  bool _onScrollUpdateNotification(ScrollNotification notification) {
    final metrics = notification.metrics;

    if (metrics.axis != Axis.vertical) return false;

    final isBottomSheet = notification.context?.findAncestorWidgetOfExactType<DraggableScrollableSheet>() != null;
    final remaining = metrics.maxScrollExtent - metrics.pixels;

    if (remaining < metrics.viewportDimension && !isBottomSheet) {
      onScrollEnd();
    }

    return false;
  }

  Widget? _bottomWidget(BuildContext context, WidgetRef ref) {
    final isLoading = ref.watch(paginatedSearchProvider.select((s) => s.isLoading));

    if (isLoading) {
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final hasMore = ref.watch(paginatedSearchProvider.select((s) => s.nextPage != null));

    if (hasMore) return null;

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Text(
            'search_no_more_result'.t(context: context),
            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceVariant),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasAssets = ref.watch(paginatedSearchProvider.select((s) => s.assets.isNotEmpty));
    final isLoading = ref.watch(paginatedSearchProvider.select((s) => s.isLoading));

    if (!hasAssets && !isLoading) {
      return const _SearchNoResults();
    }

    return NotificationListener<ScrollUpdateNotification>(
      onNotification: _onScrollUpdateNotification,
      child: SliverFillRemaining(
        child: ProviderScope(
          overrides: [
            timelineServiceProvider.overrideWith((ref) {
              final notifier = ref.read(paginatedSearchProvider.notifier);
              final service = ref
                  .watch(timelineFactoryProvider)
                  .fromAssetStream(
                    () => ref.read(paginatedSearchProvider).assets,
                    notifier.assetCount,
                    TimelineOrigin.search,
                  );
              ref.onDispose(service.dispose);
              return service;
            }),
          ],
          child: Timeline(
            groupBy: GroupAssetsBy.none,
            appBar: null,
            bottomSheet: const GeneralBottomSheet(minChildSize: 0.20),
            snapToMonth: false,
            loadingWidget: const SizedBox.shrink(),
            bottomSliverWidget: _bottomWidget(context, ref),
          ),
        ),
      ),
    );
  }
}

class _SearchNoResults extends StatelessWidget {
  const _SearchNoResults();

  @override
  Widget build(BuildContext context) {
    return SliverFillRemaining(
      hasScrollBody: false,
      child: Container(
        alignment: Alignment.center,
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off_rounded, size: 72, color: context.colorScheme.onSurfaceVariant),
            const SizedBox(height: 24),
            Text(
              'search_no_result'.t(context: context),
              textAlign: TextAlign.center,
              style: context.textTheme.bodyLarge?.copyWith(color: context.colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _SearchSuggestions extends StatelessWidget {
  const _SearchSuggestions();

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
