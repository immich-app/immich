import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/providers/search_result_page.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_result_grid.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/capitalize_first_letter.dart';

class SearchResultPage extends HookConsumerWidget {
  SearchResultPage({
    Key? key,
    required this.searchTerm,
    this.clipSearch = true,
    this.displayDateGroup = true,
  }) : super(key: key);

  final String searchTerm;
  bool clipSearch;
  bool displayDateGroup;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchTermController = useTextEditingController(text: "");
    final isNewSearch = useState(false);
    final currentSearchTerm = useState(searchTerm);
    final isDarkTheme = Theme.of(context).brightness == Brightness.dark;

    FocusNode? searchFocusNode;

    useEffect(
      () {
        searchFocusNode = FocusNode();

        Future.delayed(
          Duration.zero,
          () => ref
              .read(searchResultPageProvider.notifier)
              .search(searchTerm, clipEnable: clipSearch),
        );
        return () => searchFocusNode?.dispose();
      },
      [],
    );

    onSearchSubmitted(String newSearchTerm) {
      debugPrint("Re-Search with $newSearchTerm");
      searchFocusNode?.unfocus();
      isNewSearch.value = false;
      currentSearchTerm.value = newSearchTerm;
      ref.watch(searchResultPageProvider.notifier).search(newSearchTerm);
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
            color:
                isDarkTheme ? Colors.grey[500] : Colors.black.withOpacity(0.5),
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
              currentSearchTerm.value.capitalizeFirstLetter(),
              style: TextStyle(
                color: Theme.of(context).primaryColor,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
            ),
            Icon(
              Icons.close_rounded,
              color: Theme.of(context).primaryColor,
              size: 20,
            ),
          ],
        ),
        backgroundColor: Theme.of(context).primaryColor.withAlpha(50),
      );
    }

    buildSearchResult() {
      var searchResultPageState = ref.watch(searchResultPageProvider);
      var allSearchAssets = ref.watch(searchResultPageProvider).searchResult;

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
        if (displayDateGroup) {
          return ImmichAssetGrid(
            assets: allSearchAssets,
          );
        } else {
          return SearchResultGrid(
            assets: allSearchAssets,
          );
        }
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
              AutoRouter.of(context).pop(true);
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
