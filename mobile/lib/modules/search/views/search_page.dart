import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_bar.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/capitalize_first_letter.dart';
import 'package:openapi/api.dart';

// ignore: must_be_immutable
class SearchPage extends HookConsumerWidget {
  SearchPage({Key? key}) : super(key: key);

  FocusNode searchFocusNode = FocusNode();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSearchEnabled = ref.watch(searchPageStateProvider).isSearchEnabled;
    AsyncValue<List<CuratedLocationsResponseDto>> curatedLocation =
        ref.watch(getCuratedLocationProvider);
    AsyncValue<List<CuratedObjectsResponseDto>> curatedObjects =
        ref.watch(getCuratedObjectProvider);

    double imageSize = MediaQuery.of(context).size.width / 3;

    useEffect(
      () {
        searchFocusNode = FocusNode();
        return () => searchFocusNode.dispose();
      },
      [],
    );

    onSearchSubmitted(String searchTerm) async {
      searchFocusNode.unfocus();
      ref.watch(searchPageStateProvider.notifier).disableSearch();

      AutoRouter.of(context).push(SearchResultRoute(searchTerm: searchTerm));
    }

    buildPlaces() {
      return curatedLocation.when(
        loading: () => SliverToBoxAdapter(
          child: SizedBox(
            height: imageSize,
            child: const Center(child: ImmichLoadingIndicator()),
          ),
        ),
        error: (err, stack) => SliverToBoxAdapter(
          child: Text('Error: $err'),
        ),
        data: (curatedLocations) {
          return SliverGrid(
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 140,
              mainAxisSpacing: 4,
              crossAxisSpacing: 4,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final locationInfo = curatedLocations[index];
                final thumbnailRequestUrl =
                    '${box.get(serverEndpointKey)}/asset/thumbnail/${locationInfo.id}';
                return ThumbnailWithInfo(
                  imageUrl: thumbnailRequestUrl,
                  textInfo: locationInfo.city,
                  onTap: () {
                    AutoRouter.of(context).push(
                      SearchResultRoute(searchTerm: locationInfo.city),
                    );
                  },
                );
              },
              childCount: curatedLocations.length,
            ),
          );
        },
      );
    }

    buildThings() {
      return curatedObjects.when(
        loading: () => SliverToBoxAdapter(
          child: SizedBox(
            height: imageSize,
            child: const Center(child: ImmichLoadingIndicator()),
          ),
        ),
        error: (err, stack) => SliverToBoxAdapter(
          child: Text('Error: $err'),
        ),
        data: (objects) {
          return SliverGrid(
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 140,
              mainAxisSpacing: 4,
              crossAxisSpacing: 4,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final curatedObjectInfo = objects[index];
                final thumbnailRequestUrl =
                    '${box.get(serverEndpointKey)}/asset/thumbnail/${curatedObjectInfo.id}';

                return ThumbnailWithInfo(
                  imageUrl: thumbnailRequestUrl,
                  textInfo: curatedObjectInfo.object,
                  onTap: () {
                    AutoRouter.of(context).push(
                      SearchResultRoute(
                        searchTerm: curatedObjectInfo.object
                            .capitalizeFirstLetter(),
                      ),
                    );
                  },
                );
              },
              childCount: objects.length,
            ),
          );
        },
      );
    }

    return Scaffold(
      appBar: SearchBar(
        searchFocusNode: searchFocusNode,
        onSubmitted: onSearchSubmitted,
      ),
      body: GestureDetector(
        onTap: () {
          searchFocusNode.unfocus();
          ref.watch(searchPageStateProvider.notifier).disableSearch();
        },
        child: Stack(
          children: [
            CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: const Text(
                      "search_page_places",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ).tr(),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  sliver: buildPlaces(),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: const Text(
                      "search_page_things",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ).tr(),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  sliver: buildThings(),
                ),
              ],
            ),
            if (isSearchEnabled)
              SearchSuggestionList(onSubmitted: onSearchSubmitted),
          ],
        ),
      ),
    );
  }
}
