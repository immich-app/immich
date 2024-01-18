import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/providers/search_result_page.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';
import 'package:immich_mobile/shared/ui/asset_grid/multiselect_grid.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';

class SearchType {
  SearchType({required this.isClip, required this.searchTerm});

  final bool isClip;
  final String searchTerm;
}

SearchType _getSearchType(String searchTerm) {
  if (searchTerm.startsWith('m:')) {
    return SearchType(isClip: false, searchTerm: searchTerm.substring(2));
  } else {
    return SearchType(isClip: true, searchTerm: searchTerm);
  }
}

@RoutePage()
class SearchResultPage extends HookConsumerWidget {
  const SearchResultPage({
    Key? key,
    required this.searchTerm,
  }) : super(key: key);

  final String searchTerm;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchTermController = useTextEditingController(text: "");
    final isNewSearch = useState(false);
    final currentSearchTerm = useState(searchTerm);

    FocusNode? searchFocusNode;

    useEffect(
      () {
        searchFocusNode = FocusNode();

        var searchType = _getSearchType(searchTerm);

        Future.delayed(
          Duration.zero,
          () => ref
              .read(searchResultPageProvider.notifier)
              .search(searchType.searchTerm, clipEnable: searchType.isClip),
        );
        return () => searchFocusNode?.dispose();
      },
      [],
    );

    Future<void> onSearchSubmitted(String newSearchTerm) {
      debugPrint("Re-Search with $newSearchTerm");
      searchFocusNode?.unfocus();
      isNewSearch.value = false;
      currentSearchTerm.value = newSearchTerm;
      var searchType = _getSearchType(newSearchTerm);
      return ref
          .watch(searchResultPageProvider.notifier)
          .search(searchType.searchTerm, clipEnable: searchType.isClip);
    }

    buildTextField() {
      return TextField(
        controller: searchTermController,
        focusNode: searchFocusNode,
        autofocus: false,
        onTap: () {
          searchTermController.clear();
          ref.watch(searchPageStateProvider.notifier).setSearchTerm("");
          searchFocusNode?.requestFocus();
        },
        textInputAction: TextInputAction.search,
        onSubmitted: (searchTerm) {
          if (searchTerm.isNotEmpty) {
            searchTermController.clear();
            onSearchSubmitted(searchTerm);
          } else {
            isNewSearch.value = false;
          }
        },
        onChanged: (value) {
          ref.watch(searchPageStateProvider.notifier).setSearchTerm(value);
        },
        decoration: InputDecoration(
          hintText: 'search_result_page_new_search_hint'.tr(),
          enabledBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
          focusedBorder: const UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
          hintStyle: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16.0,
            color: context.isDarkTheme
                ? Colors.grey[500]
                : Colors.black.withOpacity(0.5),
          ),
        ),
      );
    }

    buildChip() {
      return Chip(
        label: Wrap(
          spacing: 5,
          runAlignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          alignment: WrapAlignment.center,
          children: [
            Text(
              currentSearchTerm.value,
              style: TextStyle(
                color: context.primaryColor,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
            ),
            Icon(
              Icons.close_rounded,
              color: context.primaryColor,
              size: 20,
            ),
          ],
        ),
        backgroundColor: context.primaryColor.withAlpha(50),
      );
    }

    Future<void> refresh() async => onSearchSubmitted(currentSearchTerm.value);

    buildSearchResult() {
      final searchResultPageState = ref.watch(searchResultPageProvider);

      if (searchResultPageState.isError) {
        return Padding(
          padding: const EdgeInsets.all(12),
          child: const Text("common_server_error").tr(),
        );
      }

      if (searchResultPageState.isLoading) {
        return const Center(child: ImmichLoadingIndicator());
      }

      if (searchResultPageState.isSuccess) {
        return MultiselectGrid(
          renderListProvider: searchRenderListProvider,
          archiveEnabled: true,
          deleteEnabled: true,
          editEnabled: true,
          favoriteEnabled: true,
          stackEnabled: false,
          onRefresh: refresh,
        );
      }

      return const SizedBox();
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          splashRadius: 20,
          onPressed: () {
            if (isNewSearch.value) {
              isNewSearch.value = false;
            } else {
              context.popRoute(true);
            }
          },
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        title: GestureDetector(
          onTap: () {
            isNewSearch.value = true;
            searchFocusNode?.requestFocus();
          },
          child: isNewSearch.value ? buildTextField() : buildChip(),
        ),
        centerTitle: false,
      ),
      body: GestureDetector(
        onTap: () {
          if (searchFocusNode != null) {
            searchFocusNode?.unfocus();
          }

          ref.watch(searchPageStateProvider.notifier).disableSearch();
        },
        child: Stack(
          children: [
            buildSearchResult(),
            if (isNewSearch.value)
              SearchSuggestionList(onSubmitted: onSearchSubmitted),
          ],
        ),
      ),
    );
  }
}
