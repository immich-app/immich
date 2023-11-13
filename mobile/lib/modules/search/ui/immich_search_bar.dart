import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';

class ImmichSearchBar extends HookConsumerWidget
    implements PreferredSizeWidget {
  const ImmichSearchBar({
    Key? key,
    required this.searchFocusNode,
    required this.onSubmitted,
  }) : super(key: key);

  final FocusNode searchFocusNode;
  final Function(String) onSubmitted;

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
        onTap: () {
          searchTermController.clear();
          ref.watch(searchPageStateProvider.notifier).getSuggestedSearchTerms();
          ref.watch(searchPageStateProvider.notifier).enableSearch();
          ref.watch(searchPageStateProvider.notifier).setSearchTerm("");

          searchFocusNode.requestFocus();
        },
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
          hintStyle: context.textTheme.titleSmall?.copyWith(
            color: context.themeData.colorScheme.onSurface.withOpacity(0.5),
            fontWeight: FontWeight.w500,
            fontSize: 14,
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
