import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/pages/search/search_body.dart';
import 'package:immich_mobile/providers/search/paginated_search.provider.dart';
import 'package:immich_mobile/providers/search/search_filters.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/asset_grid/multiselect_grid.dart';

@RoutePage()
class SearchPage extends HookConsumerWidget {
  final SearchFilter? prefilter;

  const SearchPage({super.key, this.prefilter});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textSearchType = useState<TextSearchType>(TextSearchType.context);
    final searchHintText = useState<String>('contextual_search'.tr());
    final textSearchController = useTextEditingController();

    handleTextSubmitted(String value) {
      final filter = ref.read(searchFiltersProvider);
      ref.read(searchFiltersProvider.notifier).value =
          switch (textSearchType.value) {
        TextSearchType.context => filter.copyWith(
            filename: '',
            context: value,
            description: '',
          ),
        TextSearchType.filename => filter.copyWith(
            filename: value,
            context: '',
            description: '',
          ),
        TextSearchType.description => filter.copyWith(
            filename: '',
            context: '',
            description: value,
          ),
      };
      ref.read(searchFiltersProvider.notifier).search();
    }

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        automaticallyImplyLeading: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: MenuAnchor(
              style: const MenuStyle(
                elevation: WidgetStatePropertyAll(1),
                shape: WidgetStatePropertyAll(
                  RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(24)),
                  ),
                ),
                padding: WidgetStatePropertyAll(EdgeInsets.all(4)),
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
        title: DecoratedBox(
          decoration: BoxDecoration(
            border: Border.all(
              color: context.colorScheme.onSurface.withAlpha(0),
              width: 0,
            ),
            borderRadius: const BorderRadius.all(Radius.circular(24)),
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
            key: const Key('search_text_field'),
            controller: textSearchController,
            decoration: InputDecoration(
              contentPadding: prefilter != null
                  ? const EdgeInsets.only(left: 24)
                  : const EdgeInsets.all(8),
              prefixIcon: prefilter != null
                  ? null
                  : Icon(
                      getSearchPrefixIcon(textSearchType.value),
                      color: context.colorScheme.primary,
                    ),
              hintText: searchHintText.value,
              hintStyle: context.textTheme.bodyLarge?.copyWith(
                color: context.themeData.colorScheme.onSurfaceSecondary,
              ),
              border: OutlineInputBorder(
                borderRadius: const BorderRadius.all(Radius.circular(25)),
                borderSide: BorderSide(color: context.colorScheme.surfaceDim),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: const BorderRadius.all(Radius.circular(25)),
                borderSide:
                    BorderSide(color: context.colorScheme.surfaceContainer),
              ),
              disabledBorder: OutlineInputBorder(
                borderRadius: const BorderRadius.all(Radius.circular(25)),
                borderSide: BorderSide(color: context.colorScheme.surfaceDim),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: const BorderRadius.all(Radius.circular(25)),
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
      body: const SearchBody(),
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
            emptyIndicator: isSearching
                ? const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.0),
                    child: SizedBox.shrink(),
                  )
                : const Padding(
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
      leading: Icon(icon, size: 26),
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
