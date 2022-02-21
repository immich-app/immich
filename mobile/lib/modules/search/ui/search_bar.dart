import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';

class SearchBar extends HookConsumerWidget {
  SearchBar({Key? key, required this.searchFocusNode}) : super(key: key);
  FocusNode searchFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final usernameController = useTextEditingController(text: "1");
    final isSearchEnabled = ref.watch(searchPageStateProvider).isSearchEnabled;

    return SliverPadding(
      padding: const EdgeInsets.all(8),
      sliver: SliverAppBar(
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
        forceElevated: true,
        leading: isSearchEnabled
            ? IconButton(
                onPressed: () {
                  ref.watch(searchPageStateProvider.notifier).disableSearch();
                  searchFocusNode.unfocus();
                },
                icon: const Icon(Icons.arrow_back_ios))
            : const Icon(Icons.search),
        // backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 2.0,
        pinned: true,
        floating: false,
        title: TextField(
          focusNode: searchFocusNode,
          autofocus: false,
          onTap: () {
            ref.watch(searchPageStateProvider.notifier).enableSearch();
            searchFocusNode.requestFocus();
          },
          onSubmitted: (searchTerm) {
            ref.watch(searchPageStateProvider.notifier).disableSearch();
            searchFocusNode.unfocus();
          },
          decoration: const InputDecoration(
            hintText: 'Search your photos',
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
            focusedBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.transparent),
            ),
          ),
        ),
      ),
    );
  }
}
