import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class TabControllerPage extends ConsumerWidget {
  const TabControllerPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
            tabsRouter.setActiveIndex(0);
            return false;
          },
          child: Scaffold(
            body: FadeTransition(
              opacity: animation,
              child: child,
            ),
            bottomNavigationBar: multiselectEnabled
                ? null
                : BottomNavigationBar(
                    enableFeedback: true,
                    selectedLabelStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    unselectedLabelStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    currentIndex: tabsRouter.activeIndex,
                    onTap: (index) {
                      tabsRouter.setActiveIndex(index);
                    },
                    items: [
                      BottomNavigationBarItem(
                        label: 'tab_controller_nav_photos'.tr(),
                        icon: const Icon(Icons.photo_outlined),
                        activeIcon: const Icon(Icons.photo),
                      ),
                      BottomNavigationBarItem(
                        label: 'tab_controller_nav_search'.tr(),
                        icon: const Icon(Icons.search_rounded),
                        activeIcon: const Icon(Icons.search),
                      ),
                      BottomNavigationBarItem(
                        label: 'tab_controller_nav_sharing'.tr(),
                        icon: const Icon(Icons.group_outlined),
                        activeIcon: const Icon(Icons.group),
                      ),
                      BottomNavigationBarItem(
                        label: 'tab_controller_nav_library'.tr(),
                        icon: const Icon(Icons.photo_album_outlined),
                        activeIcon: const Icon(Icons.photo_album_rounded),
                      )
                    ],
                  ),
          ),
        );
      },
    );
  }
}
