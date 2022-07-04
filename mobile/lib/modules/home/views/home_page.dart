import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';
import 'package:immich_mobile/modules/photos/views/photos_page.dart';
import 'package:immich_mobile/modules/search/views/search_page.dart';
import 'package:immich_mobile/modules/sharing/views/sharing_page.dart';

enum HomeTab {
  photos,
  search,
  sharing,
}

class HomePage extends HookConsumerWidget {
  final HomeTab selectedTab;

  const HomePage({
    super.key,
    this.selectedTab = HomeTab.photos,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var isMultiSelectEnable =
        ref.watch(homePageStateProvider).isMultiSelectEnable;

    const body = [
      PhotosPage(),
      SearchPage(),
      SharingPage(),
    ];

    return Scaffold(
      body: body[selectedTab.index],
      bottomNavigationBar: isMultiSelectEnable
          ? null
          : BottomNavigationBar(
              currentIndex: selectedTab.index,
              onTap: (index) {
                //todo state만 바뀌도록

                GoRouter.of(context).goNamed(
                  HomeTab.values.firstWhere((tab) => tab.index == index).name,
                );
              },
              items: const [
                BottomNavigationBarItem(
                  label: 'Photos',
                  icon: FaIcon(FontAwesomeIcons.photoFilm),
                ),
                BottomNavigationBarItem(
                  label: 'Search',
                  icon: FaIcon(FontAwesomeIcons.magnifyingGlass),
                ),
                BottomNavigationBarItem(
                  label: 'Sharing',
                  icon: FaIcon(FontAwesomeIcons.userGroup),
                ),
              ],
            ),
    );
  }
}
