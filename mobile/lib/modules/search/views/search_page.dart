import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/models/curated_location.model.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_bar.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';
import 'package:immich_mobile/routing/router.dart';

// ignore: must_be_immutable
class SearchPage extends HookConsumerWidget {
  SearchPage({Key? key}) : super(key: key);

  late FocusNode searchFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSearchEnabled = ref.watch(searchPageStateProvider).isSearchEnabled;
    AsyncValue<List<CuratedLocation>> curatedLocation = ref.watch(getCuratedLocationProvider);

    useEffect(() {
      searchFocusNode = FocusNode();
      return () => searchFocusNode.dispose();
    }, []);

    _onSearchSubmitted(String searchTerm) async {
      searchFocusNode.unfocus();
      ref.watch(searchPageStateProvider.notifier).disableSearch();

      AutoRouter.of(context).push(SearchResultRoute(searchTerm: searchTerm));
    }

    return Scaffold(
      appBar: SearchBar(
        searchFocusNode: searchFocusNode,
        onSubmitted: _onSearchSubmitted,
      ),
      body: GestureDetector(
        onTap: () {
          searchFocusNode.unfocus();
          ref.watch(searchPageStateProvider.notifier).disableSearch();
        },
        child: Stack(
          children: [
            curatedLocation.when(
              loading: () => const CircularProgressIndicator(),
              error: (err, stack) => Text('Error: $err'),
              data: (curatedLocations) {
                return ListView.builder(
                  itemCount: curatedLocation.value?.length,
                  itemBuilder: ((context, index) {
                    return Text(curatedLocations[index].city);
                  }),
                );
              },
            ),
            const Center(
              child: Text("Start typing to search for your photos"),
            ),
            ListView(
              children: const [],
            ),
            isSearchEnabled ? SearchSuggestionList(onSubmitted: _onSearchSubmitted) : Container(),
          ],
        ),
      ),
    );
  }
}
