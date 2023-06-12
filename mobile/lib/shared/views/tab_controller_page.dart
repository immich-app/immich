import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/asset_viewer/providers/scroll_notifier.provider.dart';
import 'package:immich_mobile/modules/home/providers/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';

class TabControllerPage extends HookConsumerWidget {
  const TabControllerPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final refreshing = ref.watch(assetProvider);

    Widget buildIcon(Widget icon) {
      if (!refreshing) return icon;
      return Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          icon,
          Positioned(
            right: -14,
            child: SizedBox(
              height: 12,
              width: 12,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(
                  Theme.of(context).primaryColor,
                ),
              ),
            ),
          ),
        ],
      );
    }

    navigationRail(TabsRouter tabsRouter) {
      return NavigationRail(
        labelType: NavigationRailLabelType.all,
        selectedIndex: tabsRouter.activeIndex,
        onDestinationSelected: (index) {
          // Selected Photos while it is active
          if (tabsRouter.activeIndex == 0 && index == 0) {
            // Scroll to top
            scrollToTopNotifierProvider.scrollToTop();
          }
          HapticFeedback.selectionClick();
          tabsRouter.setActiveIndex(index);
        },
        selectedIconTheme: IconThemeData(
          color: Theme.of(context).primaryColor,
        ),
        selectedLabelTextStyle: TextStyle(
          color: Theme.of(context).primaryColor,
        ),
        useIndicator: false,
        destinations: [
          NavigationRailDestination(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 4,
              left: 4,
              right: 4,
              bottom: 4,
            ),
            icon: const Icon(Icons.photo_library_outlined),
            selectedIcon: const Icon(Icons.photo_library),
            label: const Text('tab_controller_nav_photos').tr(),
          ),
          NavigationRailDestination(
            padding: const EdgeInsets.all(4),
            icon: const Icon(Icons.search_rounded),
            selectedIcon: const Icon(Icons.search),
            label: const Text('tab_controller_nav_search').tr(),
          ),
          NavigationRailDestination(
            padding: const EdgeInsets.all(4),
            icon: const Icon(Icons.share_rounded),
            selectedIcon: const Icon(Icons.share),
            label: const Text('tab_controller_nav_sharing').tr(),
          ),
          NavigationRailDestination(
            padding: const EdgeInsets.all(4),
            icon: const Icon(Icons.photo_album_outlined),
            selectedIcon: const Icon(Icons.photo_album),
            label: const Text('tab_controller_nav_library').tr(),
          ),
        ],
      );
    }

    bottomNavigationBar(TabsRouter tabsRouter) {
      return NavigationBar(
        selectedIndex: tabsRouter.activeIndex,
        onDestinationSelected: (index) {
          if (tabsRouter.activeIndex == 0 && index == 0) {
            // Scroll to top
            scrollToTopNotifierProvider.scrollToTop();
          }
          HapticFeedback.selectionClick();
          tabsRouter.setActiveIndex(index);
        },
        destinations: [
          NavigationDestination(
            label: 'tab_controller_nav_photos'.tr(),
            icon: const Icon(
              Icons.photo_library_outlined,
            ),
            selectedIcon: buildIcon(
              Icon(
                size: 24,
                Icons.photo_library,
                color: Theme.of(context).primaryColor,
              ),
            ),
          ),
          NavigationDestination(
            label: 'tab_controller_nav_search'.tr(),
            icon: const Icon(
              Icons.search_rounded,
            ),
            selectedIcon: Icon(
              Icons.search,
              color: Theme.of(context).primaryColor,
            ),
          ),
          NavigationDestination(
            label: 'tab_controller_nav_sharing'.tr(),
            icon: const Icon(
              Icons.group_outlined,
            ),
            selectedIcon: Icon(
              Icons.group,
              color: Theme.of(context).primaryColor,
            ),
          ),
          NavigationDestination(
            label: 'tab_controller_nav_library'.tr(),
            icon: const Icon(
              Icons.photo_album_outlined,
            ),
            selectedIcon: buildIcon(
              Icon(
                Icons.photo_album_rounded,
                color: Theme.of(context).primaryColor,
              ),
            ),
          )
        ],
      );
    }

    final multiselectEnabled = ref.watch(multiselectProvider);
    return AutoTabsRouter(
      routes: [
        const HomeRoute(),
        SearchRoute(),
        const SharingRoute(),
        const LibraryRoute()
      ],
      builder: (context, child, animation) {
        final tabsRouter = AutoTabsRouter.of(context);
        return WillPopScope(
          onWillPop: () async {
            bool atHomeTab = tabsRouter.activeIndex == 0;
            if (!atHomeTab) {
              tabsRouter.setActiveIndex(0);
            }

            return atHomeTab;
          },
          child: LayoutBuilder(
            builder: (context, constraints) {
              const medium = 600;
              final Widget? bottom;
              final Widget body;
              if (constraints.maxWidth < medium) {
                // Normal phone width
                bottom = bottomNavigationBar(tabsRouter);
                body = FadeTransition(
                  opacity: animation,
                  child: child,
                );
              } else {
                // Medium tablet width
                bottom = null;
                body = Row(
                  children: [
                    navigationRail(tabsRouter),
                    Expanded(
                      child: FadeTransition(
                        opacity: animation,
                        child: child,
                      ),
                    ),
                  ],
                );
              }
              return Scaffold(
                body: HeroControllerScope(
                  controller: HeroController(),
                  child: body,
                ),
                bottomNavigationBar: multiselectEnabled ? null : bottom,
              );
            },
          ),
        );
      },
    );
  }
}
