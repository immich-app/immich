import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset_viewer/scroll_notifier.provider.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/tab.provider.dart';

@RoutePage()
class TabControllerPage extends HookConsumerWidget {
  const TabControllerPage({super.key});

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
                  context.primaryColor,
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

          ref.read(hapticFeedbackProvider.notifier).selectionClick();
          tabsRouter.setActiveIndex(index);
          ref.read(tabProvider.notifier).state = TabEnum.values[index];
        },
        selectedIconTheme: IconThemeData(
          color: context.primaryColor,
        ),
        selectedLabelTextStyle: TextStyle(
          color: context.primaryColor,
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

          ref.read(hapticFeedbackProvider.notifier).selectionClick();
          tabsRouter.setActiveIndex(index);
          ref.read(tabProvider.notifier).state = TabEnum.values[index];
        },
        destinations: [
          NavigationDestination(
            label: 'tab_controller_nav_photos'.tr(),
            icon: const Icon(
              Icons.photo_library_outlined,
            ),
            selectedIcon: buildIcon(
              Icon(
                Icons.photo_library,
                color: context.primaryColor,
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
              color: context.primaryColor,
            ),
          ),
          NavigationDestination(
            label: 'tab_controller_nav_sharing'.tr(),
            icon: const Icon(
              Icons.group_outlined,
            ),
            selectedIcon: Icon(
              Icons.group,
              color: context.primaryColor,
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
                color: context.primaryColor,
              ),
            ),
          ),
        ],
      );
    }

    final multiselectEnabled = ref.watch(multiselectProvider);
    return AutoTabsRouter(
      routes: const [
        PhotosRoute(),
        SearchRoute(),
        SharingRoute(),
        LibraryRoute(),
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
          onPopInvoked: (didPop) =>
              !didPop ? tabsRouter.setActiveIndex(0) : null,
          child: LayoutBuilder(
            builder: (context, constraints) {
              const medium = 600;
              final Widget? bottom;
              final Widget body;
              if (constraints.maxWidth < medium) {
                // Normal phone width
                bottom = bottomNavigationBar(tabsRouter);
                body = child;
              } else {
                // Medium tablet width
                bottom = null;
                body = Row(
                  children: [
                    navigationRail(tabsRouter),
                    Expanded(child: child),
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
