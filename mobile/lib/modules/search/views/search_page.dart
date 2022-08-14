import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_bar.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/capitalize_first_letter.dart';
import 'package:openapi/api.dart';

// ignore: must_be_immutable
class SearchPage extends HookConsumerWidget {
  SearchPage({Key? key}) : super(key: key);

  FocusNode searchFocusNode = FocusNode();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);
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

    _onSearchSubmitted(String searchTerm) async {
      searchFocusNode.unfocus();
      ref.watch(searchPageStateProvider.notifier).disableSearch();

      AutoRouter.of(context).push(SearchResultRoute(searchTerm: searchTerm));
    }

    _buildPlaces() {
      return curatedLocation.when(
        loading: () => SizedBox(
          height: imageSize,
          child: const Center(child: ImmichLoadingIndicator()),
        ),
        error: (err, stack) => Text('Error: $err'),
        data: (curatedLocations) {
          return curatedLocations.isNotEmpty
              ? SizedBox(
                  height: imageSize,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(left: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: curatedLocation.value?.length,
                    itemBuilder: ((context, index) {
                      var locationInfo = curatedLocations[index];
                      var thumbnailRequestUrl =
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
                    }),
                  ),
                )
              : SizedBox(
                  height: imageSize,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(left: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: 1,
                    itemBuilder: ((context, index) {
                      return ThumbnailWithInfo(
                        imageUrl:
                            'https://images.unsplash.com/photo-1612178537253-bccd437b730e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Ymxhbmt8ZW58MHx8MHx8&auto=format&fit=crop&w=700&q=60',
                        textInfo: 'search_page_no_places'.tr(),
                        onTap: () {},
                      );
                    }),
                  ),
                );
        },
      );
    }

    _buildThings() {
      return curatedObjects.when(
        loading: () => const SizedBox(
          height: 200,
          child: Center(child: ImmichLoadingIndicator()),
        ),
        error: (err, stack) => Text('Error: $err'),
        data: (objects) {
          return objects.isNotEmpty
              ? SizedBox(
                  height: imageSize,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(left: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: curatedObjects.value?.length,
                    itemBuilder: ((context, index) {
                      var curatedObjectInfo = objects[index];
                      var thumbnailRequestUrl =
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
                    }),
                  ),
                )
              : SizedBox(
                  // height: imageSize,
                  width: imageSize,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(left: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: 1,
                    itemBuilder: ((context, index) {
                      return ThumbnailWithInfo(
                        imageUrl:
                            'https://images.unsplash.com/photo-1612178537253-bccd437b730e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Ymxhbmt8ZW58MHx8MHx8&auto=format&fit=crop&w=700&q=60',
                        textInfo: 'search_page_no_objects'.tr(),
                        onTap: () {},
                      );
                    }),
                  ),
                );
        },
      );
    }

    return Scaffold(
      appBar: SearchBar(
        searchFocusNode: searchFocusNode,
        onSubmitted: _onSearchSubmitted,
      ),
      body: GestureDetector(
        onTap: () {
          searchFocusNode.unfocus();
          ref.watch(searchPageStateProvider.notifier).disableSearch();
        },
        child: Stack(
          children: [
            ListView(
              shrinkWrap: true,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: const Text(
                    "search_page_places",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ).tr(),
                ),
                _buildPlaces(),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: const Text(
                    "search_page_things",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ).tr(),
                ),
                _buildThings()
              ],
            ),
            if (isSearchEnabled)
              SearchSuggestionList(onSubmitted: _onSearchSubmitted),
          ],
        ),
      ),
    );
  }
}
