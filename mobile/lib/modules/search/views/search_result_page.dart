import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';

class SearchResultPage extends HookConsumerWidget {
  SearchResultPage({Key? key, required this.searchTerm}) : super(key: key);

  final String searchTerm;
  late FocusNode searchFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchTermController = useTextEditingController(text: "");
    final isNewSearch = useState(false);
    final currentSearchTerm = useState(searchTerm);

    useEffect(() {
      searchFocusNode = FocusNode();
      return () => searchFocusNode.dispose();
    }, []);

    _onSearchSubmitted(String newSearchTerm) {
      debugPrint("Re-Search with $newSearchTerm");
      searchFocusNode.unfocus();
      isNewSearch.value = false;
      currentSearchTerm.value = newSearchTerm;
    }

    _buildTextField() {
      return TextField(
        controller: searchTermController,
        focusNode: searchFocusNode,
        autofocus: false,
        onTap: () {
          searchTermController.clear();
          ref.watch(searchPageStateProvider.notifier).setSearchTerm("");
          searchFocusNode.requestFocus();
        },
        textInputAction: TextInputAction.search,
        onSubmitted: (searchTerm) {
          if (searchTerm.isNotEmpty) {
            searchTermController.clear();
            _onSearchSubmitted(searchTerm);
          } else {
            isNewSearch.value = false;
          }
        },
        onChanged: (value) {
          ref.watch(searchPageStateProvider.notifier).setSearchTerm(value);
        },
        decoration: const InputDecoration(
          hintText: 'New Search',
          enabledBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
          focusedBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.transparent),
          ),
        ),
      );
    }

    _buildChip() {
      return Chip(
        label: Wrap(
          spacing: 5,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 2.0),
              child: Text(
                currentSearchTerm.value,
                style: TextStyle(color: Theme.of(context).primaryColor),
                maxLines: 1,
              ),
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
              searchFocusNode.requestFocus();
            },
            child: isNewSearch.value ? _buildTextField() : _buildChip()),
        centerTitle: false,
      ),
      body: GestureDetector(
        onTap: () {
          searchFocusNode.unfocus();
          ref.watch(searchPageStateProvider.notifier).disableSearch();
        },
        child: Stack(
          children: [
            ListView(
              children: const [Text("Search results")],
            ),
            isNewSearch.value ? SearchSuggestionList(onSubmitted: _onSearchSubmitted) : Container(),
          ],
        ),
      ),
    );
  }
}
