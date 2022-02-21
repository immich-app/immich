import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';

class SearchBar extends HookConsumerWidget with PreferredSizeWidget {
  SearchBar({Key? key, required this.searchFocusNode}) : super(key: key);
  FocusNode searchFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchTermController = useTextEditingController(text: "");
    final isSearchEnabled = ref.watch(searchPageStateProvider).isSearchEnabled;

    return AppBar(
      automaticallyImplyLeading: false,
      leading: isSearchEnabled
          ? IconButton(
              onPressed: () {
                searchFocusNode.unfocus();
                ref.watch(searchPageStateProvider.notifier).disableSearch();
              },
              icon: const Icon(Icons.arrow_back_ios_rounded))
          : const Icon(Icons.search_rounded),
      title: TextField(
        controller: searchTermController,
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
        onChanged: (value) {
          ref.watch(searchPageStateProvider.notifier).setSearchTerm(value);
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
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
