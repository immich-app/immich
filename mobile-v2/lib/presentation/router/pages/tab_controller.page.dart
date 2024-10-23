import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_adaptive_scaffold/flutter_adaptive_scaffold.dart';
import 'package:immich_mobile/i18n/strings.g.dart';
import 'package:immich_mobile/presentation/components/common/immich_navigation_rail.widget.dart';
import 'package:immich_mobile/presentation/components/common/user_avatar.widget.dart';
import 'package:immich_mobile/presentation/components/image/immich_logo.widget.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/presentation/states/current_user.state.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';
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
          onPopInvokedWithResult: (didPop, _) =>
              didPop ? null : tabsRouter.setActiveIndex(0),
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
        primaryNavigation: SlotLayout(
          config: <Breakpoint, SlotLayoutConfig>{
            Breakpoints.mediumAndUp: SlotLayout.from(
              builder: (_) => _ImNavigationRailBuilder(
                destinations: destinations
                    .map((NavigationDestination destination) =>
                        AdaptiveScaffold.toRailDestination(destination))
                    .toList(),
                selectedIndex: selectedIndex,
                backgroundColor: navRailTheme.backgroundColor,
                leading: ImUserAvatar(
                  user: di<CurrentUserProvider>().value,
                  dimension: SizeConstants.m,
                  radius: SizeConstants.m,
                ),
                trailing: ImLogo(dimension: SizeConstants.xm),
                onDestinationSelected: onSelectedIndexChange,
                selectedIconTheme: navRailTheme.selectedIconTheme,
                unselectedIconTheme: navRailTheme.unselectedIconTheme,
                selectedLabelTextStyle: navRailTheme.selectedLabelTextStyle,
                unSelectedLabelTextStyle: navRailTheme.unselectedLabelTextStyle,
              ),
              key: const Key(
                '_TabControllerAdaptiveScaffold Primary Navigation Medium',
              ),
            ),
          },
        ),
        body: SlotLayout(
          config: {
            Breakpoints.standard: SlotLayout.from(
              builder: body,
              key: const Key('_TabControllerAdaptiveScaffold Body'),
            ),
          },
        ),
        // No animation on layout change
        transitionDuration: Duration.zero,
      ),
      bottomNavigationBar: SlotLayout(
        config: <Breakpoint, SlotLayoutConfig>{
          Breakpoints.small: SlotLayout.from(
            builder: (_) => AdaptiveScaffold.standardBottomNavigationBar(
              destinations: destinations,
              currentIndex: selectedIndex,
              onDestinationSelected: onSelectedIndexChange,
            ),
            key: const Key(
              '_TabControllerAdaptiveScaffold Bottom Navigation Small',
            ),
          ),
        },
      ),
    );
  }
}

class _ImNavigationRailBuilder extends StatelessWidget {
  final List<NavigationRailDestination> destinations;
  final int? selectedIndex;
  final Color? backgroundColor;
  final Function(int)? onDestinationSelected;
  final IconThemeData? selectedIconTheme;
  final IconThemeData? unselectedIconTheme;
  final TextStyle? selectedLabelTextStyle;
  final TextStyle? unSelectedLabelTextStyle;
  final Widget? leading;
  final Widget? trailing;

  const _ImNavigationRailBuilder({
    required this.destinations,
    this.selectedIndex,
    this.backgroundColor,
    this.leading,
    this.trailing,
    this.onDestinationSelected,
    this.selectedIconTheme,
    this.unselectedIconTheme,
    this.selectedLabelTextStyle,
    this.unSelectedLabelTextStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Builder(builder: (BuildContext _) {
      return SizedBox(
        width: 72,
        height: context.height,
        child: LayoutBuilder(
          builder: (BuildContext _, BoxConstraints constraints) {
            return ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: IntrinsicHeight(
                child: ImNavigationRail(
                  backgroundColor: backgroundColor,
                  leading: leading,
                  trailing: trailing,
                  destinations: destinations,
                  selectedIndex: selectedIndex,
                  onDestinationSelected: onDestinationSelected,
                  labelType: NavigationRailLabelType.none,
                  unselectedLabelTextStyle: unSelectedLabelTextStyle,
                  selectedLabelTextStyle: selectedLabelTextStyle,
                  unselectedIconTheme: unselectedIconTheme,
                  selectedIconTheme: selectedIconTheme,
                ),
              ),
            );
          },
        ),
      );
    });
  }
}
