import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/pages/search/show_camera_picker.dart';
import 'package:immich_mobile/pages/search/show_date_picker.dart';
import 'package:immich_mobile/pages/search/show_display_option_picker.dart';
import 'package:immich_mobile/pages/search/show_location_picker.dart';
import 'package:immich_mobile/pages/search/show_media_type_picker.dart';
import 'package:immich_mobile/pages/search/show_people_picker.dart';
import 'package:immich_mobile/providers/search/is_searching.provider.dart';
import 'package:immich_mobile/providers/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/search/search_filters.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';

class SearchBody extends HookConsumerWidget {
  const SearchBody({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSearching = ref.watch(isSearchingProvider);

    loadMoreSearchResult() async {
      final filter = ref.read(searchFiltersProvider);
      final hasResult =
          await ref.read(paginatedSearchProvider.notifier).search(filter);

      if (!hasResult) {
        context.showSnackBar(
          searchInfoSnackBar(
            'search_no_more_result'.tr(),
            context.textTheme.labelLarge,
            context.colorScheme.onSurface,
          ),
        );
      }
    }

    const pickers = Padding(
      padding: EdgeInsets.only(top: 12.0),
      child: SizedBox(
        height: 50,
        child: ListView.custom(
          key: Key('search_filter_chip_list'),
          shrinkWrap: true,
          scrollDirection: Axis.horizontal,
          padding: EdgeInsets.symmetric(horizontal: 16),
          childrenDelegate: SliverChildListDelegate.fixed(
            [
              ShowPeoplePicker(),
              ShowLocationPicker(),
              ShowCameraPicker(),
              ShowDatePicker(),
              ShowMediaTypePicker(),
              ShowDisplayOptionsPicker(),
            ],
            addAutomaticKeepAlives: true,
            addRepaintBoundaries: true,
            addSemanticIndexes: true,
          ),
        ),
      ),
    );

    // TODO: extend render list without discarding the existing result grid
    return isSearching
        ? const Column(
            children: [
              pickers,
              Expanded(
                child: Center(child: CircularProgressIndicator.adaptive()),
              ),
            ],
          )
        : Column(
            children: [
              pickers,
              SearchResultGrid(onScrollEnd: loadMoreSearchResult),
            ],
          );
  }

  SnackBar searchInfoSnackBar(
    String message,
    TextStyle? textStyle,
    Color closeIconColor,
  ) {
    return SnackBar(
      content: Text(message, style: textStyle),
      showCloseIcon: true,
      behavior: SnackBarBehavior.fixed,
      closeIconColor: closeIconColor,
    );
  }

  IconData getSearchPrefixIcon(TextSearchType textSearchType) {
    switch (textSearchType) {
      case TextSearchType.context:
        return Icons.image_search_rounded;
      case TextSearchType.filename:
        return Icons.abc_rounded;
      case TextSearchType.description:
        return Icons.text_snippet_outlined;
      default:
        return Icons.search_rounded;
    }
  }
}

class SearchResultGrid extends StatelessWidget {
  final VoidCallback onScrollEnd;

  const SearchResultGrid({
    super.key,
    required this.onScrollEnd,
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
            emptyIndicator: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: SearchEmptyContent(),
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
          context.isDarkTheme
              ? const Center(
                  child: Image(
                    image: AssetImage('assets/polaroid-dark.png'),
                    height: 125,
                  ),
                )
              : const Center(
                  child: Image(
                    image: AssetImage('assets/polaroid-light.png'),
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
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
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
            icon: const Icon(Icons.schedule_outlined, size: 26),
            isTop: true,
            onTap: () => context.pushRoute(const RecentlyAddedRoute()),
          ),
          QuickLink(
            title: 'videos'.tr(),
            icon: const Icon(Icons.play_circle_outline_rounded, size: 26),
            onTap: () => context.pushRoute(const AllVideosRoute()),
          ),
          QuickLink(
            title: 'favorites'.tr(),
            icon: const Icon(Icons.favorite_border_rounded, size: 26),
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
  final Icon icon;
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
    final shape = switch ((isTop, isBottom)) {
      (true, false) => const RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
      (false, true) => const RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(20),
          ),
        ),
      (true, true) => const RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(20),
          ),
        ),
      (false, false) =>
        const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
    };

    return ListTile(
      shape: shape,
      leading: icon,
      title: Text(
        title,
        style:
            context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500),
      ),
      onTap: onTap,
    );
  }
}
