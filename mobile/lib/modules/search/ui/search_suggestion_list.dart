import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';

class SearchSuggestionList extends ConsumerWidget {
  const SearchSuggestionList({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchTerm = ref.watch(searchPageStateProvider).searchTerm;
    final searchSuggestion = ref.watch(searchPageStateProvider).searchSuggestion;

    return Container(
      color: searchTerm.isEmpty ? Colors.black.withOpacity(0.5) : Theme.of(context).scaffoldBackgroundColor,
      child: CustomScrollView(
        slivers: [
          SliverFillRemaining(
            hasScrollBody: true,
            child: ListView.builder(
              itemBuilder: ((context, index) {
                return ListTile(
                  onTap: () {
                    print("navigate to this search result: ${searchSuggestion[index]} ");
                  },
                  title: Text(searchSuggestion[index]),
                );
              }),
              itemCount: searchSuggestion.length,
            ),
          ),
        ],
      ),
    );
  }
}
