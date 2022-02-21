import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/immich_sliver_appbar.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_bar.dart';

class SearchPage extends HookConsumerWidget {
  SearchPage({Key? key}) : super(key: key);

  late FocusNode searchFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSearchEnabled = ref.watch(searchPageStateProvider).isSearchEnabled;

    useEffect(() {
      searchFocusNode = FocusNode();
      return () {
        searchFocusNode.dispose();
      };
    }, []);

    return Scaffold(
        body: GestureDetector(
      onTap: () {
        searchFocusNode.unfocus();

        if (isSearchEnabled) {
          ref.watch(searchPageStateProvider.notifier).disableSearch();
        }
      },
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            isSearchEnabled ? const SliverToBoxAdapter() : const ImmichSliverAppBar(),
            SearchBar(searchFocusNode: searchFocusNode),
            SliverList(
              delegate: SliverChildListDelegate(List.generate(
                100,
                (i) => ListTile(
                  title: Text('Scroll $i'),
                ),
              ).toList()),
            ),
          ],
        ),
      ),
    ));
  }
}
