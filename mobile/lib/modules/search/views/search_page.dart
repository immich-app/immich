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
      return SizedBox(
        height: imageSize,
        child: curatedLocation.when(
          loading: () => const Center(child: ImmichLoadingIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
          data: (curatedLocations) => ListView.builder(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
            ),
            scrollDirection: Axis.horizontal,
            itemBuilder: (context, index) {
              final locationInfo = curatedLocations[index];
              final thumbnailRequestUrl =
                  '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/${locationInfo.id}';
              return SizedBox(
                width: imageSize,
                child: Padding(
                  padding: const EdgeInsets.only(right: 4.0),
                  child: ThumbnailWithInfo(
                    imageUrl: thumbnailRequestUrl,
                    textInfo: locationInfo.city,
                    onTap: () {
                      AutoRouter.of(context).push(
                        SearchResultRoute(searchTerm: locationInfo.city),
                      );
                    },
                  ),
                ),
              );
            },
            itemCount: curatedLocations.length.clamp(0, 10),
          ),
        ),
      );
    }

    buildEmptyThumbnail() {
      return Align(
        alignment: Alignment.centerLeft,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: SizedBox(
            width: imageSize,
            height: imageSize,
            child: ThumbnailWithInfo(
              textInfo: '',
              onTap: () {},
            ),
          ),
        ),
      );
    }

    buildThings() {
      return curatedObjects.when(
        loading: () => SizedBox(
          height: imageSize,
          child: const Center(child: ImmichLoadingIndicator()),
        ),
        error: (err, stack) => SizedBox(
          height: imageSize,
          child: Center(child: Text('Error: $err')),
        ),
        data: (objects) => objects.isEmpty
            ? buildEmptyThumbnail()
            : SizedBox(
                height: imageSize,
                child: ListView.builder(
                  shrinkWrap: true,
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                  ),
                  itemBuilder: (context, index) {
                    final curatedObjectInfo = objects[index];
                    final thumbnailRequestUrl =
                        '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/${curatedObjectInfo.id}';
                    return SizedBox(
                      width: imageSize,
                      child: Padding(
                        padding: const EdgeInsets.only(right: 4.0),
                        child: ThumbnailWithInfo(
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
                        ),
                      ),
                    );
                  },
                  itemCount: objects.length.clamp(0, 10),
                ),
              ),
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
            ListView(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                    vertical: 4.0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "search_page_places",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ).tr(),
                      TextButton(
                        child: Text(
                          'search_page_view_all_button',
                          style: TextStyle(
                            color: Theme.of(context).primaryColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14.0,
                          ),
                        ).tr(),
                        onPressed: () => AutoRouter.of(context).push(
                          const CuratedLocationRoute(),
                        ),
                      ),
                    ],
                  ),
                ),
                buildPlaces(),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                    vertical: 4.0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "search_page_things",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ).tr(),
                      TextButton(
                        child: Text(
                          'search_page_view_all_button',
                          style: TextStyle(
                            color: Theme.of(context).primaryColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14.0,
                          ),
                        ).tr(),
                        onPressed: () => AutoRouter.of(context).push(
                          const CuratedObjectRoute(),
                        ),
                      ),
                    ],
                  ),
                ),
                buildThings(),
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
