import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';

class SearchSuggestionList extends ConsumerWidget {
  const SearchSuggestionList({super.key, required this.onSubmitted});

  final Function(String) onSubmitted;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchTerm = ref.watch(searchPageStateProvider).searchTerm;
    final searchSuggestion =
        ref.watch(searchPageStateProvider).searchSuggestion;

    return Container(
      color: searchTerm.isEmpty
          ? Colors.black.withOpacity(0.5)
          : context.scaffoldBackgroundColor,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              color: context.isDarkTheme ? Colors.grey[800] : Colors.grey[100],
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: RichText(
                  text: TextSpan(
                    children: [
                      TextSpan(
                        text: 'search_suggestion_list_smart_search_hint_1'.tr(),
                        style: context.textTheme.bodyMedium,
                      ),
                      TextSpan(
                        text: 'search_suggestion_list_smart_search_hint_2'.tr(),
                        style: context.textTheme.bodyMedium?.copyWith(
                          color: context.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverFillRemaining(
            hasScrollBody: true,
            child: ListView.builder(
              itemBuilder: ((context, index) {
                return ListTile(
                  onTap: () {
                    onSubmitted("m:${searchSuggestion[index]}");
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
