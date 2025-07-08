import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';

@RoutePage()
class DriftSearchPage extends ConsumerStatefulWidget {
  const DriftSearchPage({super.key});

  @override
  ConsumerState<DriftSearchPage> createState() => _DriftSearchPageState();
}

class _DriftSearchPageState extends ConsumerState<DriftSearchPage> {
  final searchController = TextEditingController();
  final searchFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
  }

  void onSearch(String searchTerm) {
    final userId = ref.watch(currentUserProvider)?.id;
  }

  void clearSearch() {

  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final userId = ref.watch(currentUserProvider)?.id;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const ImmichSliverAppBar(),
          _SearchBar(
            searchController: searchController,
            searchFocusNode: searchFocusNode,
            onClearSearch: clearSearch,
          ),
          const _SearchFilterChipRow(),
          const _QuickLinkList(),
        ],
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({
    required this.searchController,
    required this.searchFocusNode,
    required this.onClearSearch,
  });

  final TextEditingController searchController;
  final FocusNode searchFocusNode;
  final VoidCallback onClearSearch;

  @override
  Widget build(BuildContext context) {
    return const SliverPadding(
      padding: EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverToBoxAdapter(
        child: SizedBox.shrink(),
      ),
    );
  }
}

class _SearchFilterChipRow extends StatelessWidget {
  const _SearchFilterChipRow();

  void showPeoplePicker() {

  }

  void showLocationPicker() {

  }

  void showCameraPicker() {

  }

  void showDatePicker() {

  }

  void showMediaTypePicker() {

  }

  void showDisplayOptionPicker() {

  }

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.only(left: 16, top: 12, right: 16),
      sliver: SliverToBoxAdapter(
        child: SizedBox(
          height: 50,
          child: ListView(
            key: const Key('search_filter_chip_list'),
            shrinkWrap: true,
            scrollDirection: Axis.horizontal,
            children: [
              _SearchFilterChip(
                icon: Icons.people_alt_outlined,
                onTap: showPeoplePicker,
                label: 'people'.t(context: context),
                // currentFilter: peopleCurrentFilterWidget.value,
              ),
              _SearchFilterChip(
                icon: Icons.location_on_outlined,
                onTap: showLocationPicker,
                label: 'search_filter_location'.t(context: context),
                // currentFilter: locationCurrentFilterWidget.value,
              ),
              _SearchFilterChip(
                icon: Icons.camera_alt_outlined,
                onTap: showCameraPicker,
                label: 'camera'.t(context: context),
                // currentFilter: cameraCurrentFilterWidget.value,
              ),
              _SearchFilterChip(
                icon: Icons.date_range_outlined,
                onTap: showDatePicker,
                label: 'search_filter_date'.t(context: context),
                // currentFilter: dateRangeCurrentFilterWidget.value,
              ),
              _SearchFilterChip(
                icon: Icons.video_collection_outlined,
                onTap: showMediaTypePicker,
                label: 'search_filter_media_type'.t(context: context),
                // currentFilter: mediaTypeCurrentFilterWidget.value,
              ),
              _SearchFilterChip(
                icon: Icons.display_settings_outlined,
                onTap: showDisplayOptionPicker,
                label: 'search_filter_display_options'.t(context: context),
                // currentFilter: displayOptionCurrentFilterWidget.value,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchFilterChip extends StatelessWidget {
  const _SearchFilterChip({
    required this.label,
    required this.icon,
    required this.onTap,
    this.currentFilter,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final Widget? currentFilter;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        elevation: 0,
        color: currentFilter == null
            ? context.colorScheme.surfaceContainerLow
            : context.primaryColor.withValues(alpha: .5),
        shape: StadiumBorder(
          side: BorderSide(
            color: currentFilter == null
                ? context.colorScheme.outline.withAlpha(15)
                : context.colorScheme.secondaryContainer,
          ),
        ),
        child: Padding(
          padding:
              const EdgeInsets.symmetric(vertical: 2.0, horizontal: 14.0),
          child: Row(
            children: [
              Icon(
                icon,
                size: 18,
              ),
              const SizedBox(width: 4.0),
              currentFilter ?? Text(label),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickLinkList extends StatelessWidget {
  const _QuickLinkList();

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverToBoxAdapter(
        child: Container(
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(
              Radius.circular(20),
            ),
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
            padding: const EdgeInsets.all(0),
            physics: const NeverScrollableScrollPhysics(),
            children: [
              _QuickLink(
                label: 'recently_taken'.t(context: context),
                icon: Icons.schedule_outlined,
                onTap: () => context.pushRoute(const RecentlyTakenRoute()),
                isTop: true,
              ),
              _QuickLink(
                label: 'videos'.t(context: context),
                icon: Icons.play_circle_outline_rounded,
                onTap: () => context.pushRoute(const DriftVideoRoute()),
              ),
              _QuickLink(
                label: 'favorites'.t(context: context),
                icon: Icons.favorite_border_rounded,
                onTap: () => context.pushRoute(const DriftFavoriteRoute()),
                isBottom: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickLink extends StatelessWidget {
  const _QuickLink({
    required this.label,
    required this.icon,
    required this.onTap,
    this.isTop = false,
    this.isBottom = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isTop;
  final bool isBottom;

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
        label,
        style: context.textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      onTap: onTap,
    );
  }
}
