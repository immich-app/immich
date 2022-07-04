import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/home_page_state.provider.dart';
import 'package:immich_mobile/modules/photos/views/photos_page.dart';
import 'package:immich_mobile/modules/search/views/search_page.dart';
import 'package:immich_mobile/modules/sharing/views/sharing_page.dart';

final indexProvider = StateProvider((ref) => 0);

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

    return Scaffold(
      body: IndexedStack(
        index: ref.watch(indexProvider.state).state,
        children: const [
          PhotosPage(),
          SearchPage(),
          SharingPage(),
        ],
      ),
      bottomNavigationBar: isMultiSelectEnable
          ? null
          : BottomNavigationBar(
              currentIndex: ref.watch(indexProvider.state).state,
              onTap: (index) => ref.read(indexProvider.state).state = index,
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

enum HomeTab {
  photos,
  search,
  sharing,
}
