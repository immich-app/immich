import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_notifier.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/search/search_input_focus.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';

@RoutePage()
class TabShellPage extends ConsumerWidget {
  const TabShellPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isScreenLandscape = context.orientation == Orientation.landscape;

    Widget buildIcon({required Widget icon, required bool isProcessing}) {
      if (!isProcessing) return icon;
      return Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          icon,
          Positioned(
            right: -18,
            child: SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  context.primaryColor,
                ),
              ),
            ),
          ),
        ],
      );
    }

    final navigationDestinations = [
      NavigationDestination(
        label: 'photos'.tr(),
        icon: const Icon(
          Icons.photo_library_outlined,
        ),
        selectedIcon: buildIcon(
          isProcessing: false,
          icon: Icon(
            Icons.photo_library,
            color: context.primaryColor,
          ),
        ),
      ),
      NavigationDestination(
        label: 'search'.tr(),
        icon: const Icon(
          Icons.search_rounded,
        ),
        selectedIcon: Icon(
          Icons.search,
          color: context.primaryColor,
        ),
      ),
      NavigationDestination(
        label: 'albums'.tr(),
        icon: const Icon(
          Icons.photo_album_outlined,
        ),
        selectedIcon: buildIcon(
          isProcessing: false,
          icon: Icon(
            Icons.photo_album_rounded,
            color: context.primaryColor,
          ),
        ),
      ),
      NavigationDestination(
        label: 'library'.tr(),
        icon: const Icon(
          Icons.space_dashboard_outlined,
        ),
        selectedIcon: buildIcon(
          isProcessing: false,
          icon: Icon(
            Icons.space_dashboard_rounded,
            color: context.primaryColor,
          ),
        ),
      ),
    ];

    Widget navigationRail(TabsRouter tabsRouter) {
      return NavigationRail(
        destinations: navigationDestinations
            .map(
              (e) => NavigationRailDestination(
                icon: e.icon,
                label: Text(e.label),
                selectedIcon: e.selectedIcon,
              ),
            )
            .toList(),
        onDestinationSelected: (index) =>
            _onNavigationSelected(tabsRouter, index, ref),
        selectedIndex: tabsRouter.activeIndex,
        labelType: NavigationRailLabelType.all,
        groupAlignment: 0.0,
      );
    }

    return AutoTabsRouter(
      routes: [
        const MainTimelineRoute(),
        SearchRoute(),
        const DriftAlbumsRoute(),
        const DriftLibraryRoute(),
      ],
      duration: const Duration(milliseconds: 600),
      transitionBuilder: (context, child, animation) => FadeTransition(
        opacity: animation,
        child: child,
      ),
      builder: (context, child) {
        final tabsRouter = AutoTabsRouter.of(context);
        return PopScope(
          canPop: tabsRouter.activeIndex == 0,
          onPopInvokedWithResult: (didPop, _) =>
              !didPop ? tabsRouter.setActiveIndex(0) : null,
          child: Scaffold(
            resizeToAvoidBottomInset: false,
            body: isScreenLandscape
                ? Row(
                    children: [
                      navigationRail(tabsRouter),
                      const VerticalDivider(),
                      Expanded(child: child),
                    ],
                  )
                : child,
            bottomNavigationBar: _BottomNavigationBar(
              tabsRouter: tabsRouter,
              destinations: navigationDestinations,
            ),
          ),
        );
      },
    );
  }
}

void _onNavigationSelected(TabsRouter router, int index, WidgetRef ref) {
  // On Photos page menu tapped
  if (router.activeIndex == 0 && index == 0) {
    scrollToTopNotifierProvider.scrollToTop();
  }

  // On Search page tapped
  if (router.activeIndex == 1 && index == 1) {
    ref.read(searchInputFocusProvider).requestFocus();
  }

  // Album page
  if (index == 2) {
    ref.read(remoteAlbumProvider.notifier).getAll();
  }

  ref.read(hapticFeedbackProvider.notifier).selectionClick();
  router.setActiveIndex(index);
  ref.read(tabProvider.notifier).state = TabEnum.values[index];
}

class _BottomNavigationBar extends ConsumerWidget {
  const _BottomNavigationBar({
    required this.tabsRouter,
    required this.destinations,
  });

  final List<Widget> destinations;
  final TabsRouter tabsRouter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isScreenLandscape = context.orientation == Orientation.landscape;
    final isMultiselectEnabled =
        ref.watch(multiSelectProvider.select((s) => s.isEnabled));

    if (isScreenLandscape || isMultiselectEnabled) {
      return const SizedBox.shrink();
    }

    return NavigationBar(
      selectedIndex: tabsRouter.activeIndex,
      onDestinationSelected: (index) =>
          _onNavigationSelected(tabsRouter, index, ref),
      destinations: destinations,
    );
  }
}
