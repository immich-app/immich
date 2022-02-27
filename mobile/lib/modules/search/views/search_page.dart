import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_bar.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';

// ignore: must_be_immutable
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
      appBar: SearchBar(searchFocusNode: searchFocusNode),
      body: GestureDetector(
        onTap: () {
          searchFocusNode.unfocus();
          ref.watch(searchPageStateProvider.notifier).disableSearch();
        },
        child: Stack(
          children: [
            ListView(
              children: [
                Container(
                  height: 300,
                  color: Colors.blue,
                ),
                Container(
                  height: 300,
                  color: Colors.red,
                ),
                Container(
                  height: 300,
                  color: Colors.green,
                ),
                Container(
                  height: 300,
                  color: Colors.blue,
                ),
                Container(
                  height: 300,
                  color: Colors.red,
                ),
                Container(
                  height: 300,
                  color: Colors.green,
                ),
              ],
            ),
            isSearchEnabled ? const SearchSuggestionList() : Container(),
          ],
        ),
      ),
    );
  }
}
