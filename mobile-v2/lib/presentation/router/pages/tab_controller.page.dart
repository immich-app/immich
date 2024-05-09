import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_adaptive_scaffold/flutter_adaptive_scaffold.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:material_symbols_icons/symbols.dart';

@RoutePage()
class TabControllerPage extends StatelessWidget {
  const TabControllerPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AutoTabsRouter(
      routes: const [
        HomeRoute(),
        SearchRoute(),
        SharingRoute(),
        LibraryRoute(),
      ],
      builder: (ctx, child) {
        final tabsRouter = AutoTabsRouter.of(ctx);
        // Pop-back to photos tab or if already in photos tab, close the app
        return PopScope(
          canPop: tabsRouter.activeIndex == 0,
          onPopInvoked: (didPop) =>
              !didPop ? tabsRouter.setActiveIndex(0) : null,
          child: _TabControllerAdaptiveScaffold(
            body: (ctxx) => child,
            selectedIndex: tabsRouter.activeIndex,
            onSelectedIndexChange: (index) => tabsRouter.setActiveIndex(index),
            destinations: [
              NavigationDestination(
                icon: const Icon(Symbols.photo_rounded),
                selectedIcon: const Icon(Symbols.photo_rounded, fill: 1.0),
                label: context.t.tab_controller.photos,
              ),
              NavigationDestination(
                icon: const Icon(Symbols.search_rounded),
                selectedIcon: const Icon(Symbols.search_rounded, fill: 1.0),
                label: context.t.tab_controller.search,
              ),
              NavigationDestination(
                icon: const Icon(Symbols.group_rounded),
                selectedIcon: const Icon(Symbols.group_rounded, fill: 1.0),
                label: context.t.tab_controller.sharing,
              ),
              NavigationDestination(
                icon: const Icon(Symbols.newsstand_rounded),
                selectedIcon: const Icon(Symbols.newsstand_rounded, fill: 1.0),
                label: context.t.tab_controller.library,
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Adaptive scaffold to layout bottom navigation bar and navigation rail for the main
/// tab controller layout. This is not used elsewhere so is private to this widget
class _TabControllerAdaptiveScaffold extends StatelessWidget {
  const _TabControllerAdaptiveScaffold({
    required this.body,
    required this.selectedIndex,
    required this.onSelectedIndexChange,
    required this.destinations,
  });

  final WidgetBuilder body;
  final List<NavigationDestination> destinations;
  final int selectedIndex;
  final void Function(int) onSelectedIndexChange;

  @override
  Widget build(BuildContext context) {
    final NavigationRailThemeData navRailTheme =
        Theme.of(context).navigationRailTheme;

    return Scaffold(
      body: AdaptiveLayout(
        // No animation on layout change
        transitionDuration: Duration.zero,
        primaryNavigation: SlotLayout(
          config: <Breakpoint, SlotLayoutConfig>{
            Breakpoints.mediumAndUp: SlotLayout.from(
              key: const Key(
                '_TabControllerAdaptiveScaffold Primary Navigation Medium',
              ),
              builder: (_) => AdaptiveScaffold.standardNavigationRail(
                selectedIndex: selectedIndex,
                destinations: destinations
                    .map((NavigationDestination destination) =>
                        AdaptiveScaffold.toRailDestination(destination))
                    .toList(),
                onDestinationSelected: onSelectedIndexChange,
                backgroundColor: navRailTheme.backgroundColor,
                selectedIconTheme: navRailTheme.selectedIconTheme,
                unselectedIconTheme: navRailTheme.unselectedIconTheme,
                selectedLabelTextStyle: navRailTheme.selectedLabelTextStyle,
                unSelectedLabelTextStyle: navRailTheme.unselectedLabelTextStyle,
              ),
            ),
          },
        ),
        body: SlotLayout(
          config: {
            Breakpoints.standard: SlotLayout.from(
              key: const Key('_TabControllerAdaptiveScaffold Body'),
              builder: body,
            ),
          },
        ),
      ),
      bottomNavigationBar: SlotLayout(
        config: <Breakpoint, SlotLayoutConfig>{
          Breakpoints.small: SlotLayout.from(
            key: const Key(
              '_TabControllerAdaptiveScaffold Bottom Navigation Small',
            ),
            builder: (_) => AdaptiveScaffold.standardBottomNavigationBar(
              currentIndex: selectedIndex,
              destinations: destinations,
              onDestinationSelected: onSelectedIndexChange,
            ),
          ),
        },
      ),
    );
  }
}
