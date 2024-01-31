import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';

class ImmichSearchBar extends HookConsumerWidget
    implements PreferredSizeWidget {
  const ImmichSearchBar({
    super.key,
    required this.searchFocusNode,
    required this.onSubmitted,
  });

  final FocusNode searchFocusNode;
  final Function(String) onSubmitted;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchTermController = useTextEditingController(text: "");
    final isSearchEnabled = ref.watch(searchPageStateProvider).isSearchEnabled;

    focusSearch() {
      searchTermController.clear();
      ref.watch(searchPageStateProvider.notifier).getSuggestedSearchTerms();
      ref.watch(searchPageStateProvider.notifier).enableSearch();
      ref.watch(searchPageStateProvider.notifier).setSearchTerm("");

      searchFocusNode.requestFocus();
    }

    useEffect(
      () {
        searchFocusNotifier.addListener(focusSearch);
        return () {
          searchFocusNotifier.removeListener(focusSearch);
        };
      },
      [],
    );

    return AppBar(
      automaticallyImplyLeading: false,
      leading: isSearchEnabled
          ? IconButton(
              onPressed: () {
                searchFocusNode.unfocus();
                ref.watch(searchPageStateProvider.notifier).disableSearch();
                searchTermController.clear();
              },
              icon: const Icon(Icons.arrow_back_ios_rounded),
            )
          : const Icon(
              Icons.search_rounded,
              size: 20,
            ),
      title: TextField(
        controller: searchTermController,
        focusNode: searchFocusNode,
        autofocus: false,
        onTap: focusSearch,
        onSubmitted: (searchTerm) {
          onSubmitted(searchTerm);
          searchTermController.clear();
          ref.watch(searchPageStateProvider.notifier).setSearchTerm("");
        },
        onChanged: (value) {
          ref.watch(searchPageStateProvider.notifier).setSearchTerm(value);
        },
        decoration: InputDecoration(
          hintText: 'search_bar_hint'.tr(),
          hintStyle: context.textTheme.bodyLarge?.copyWith(
            color: context.themeData.colorScheme.onSurface.withOpacity(0.75),
          ),
          enabledBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
          focusedBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

// Used to focus search from outside this widget.
// For example when double pressing the search nav icon.
final searchFocusNotifier = SearchFocusNotifier();

class SearchFocusNotifier with ChangeNotifier {
  void requestFocus() {
    notifyListeners();
  }
}
