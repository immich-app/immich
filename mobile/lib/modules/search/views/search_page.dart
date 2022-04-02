import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/search/models/curated_location.model.dart';
import 'package:immich_mobile/modules/search/models/curated_object.model.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_bar.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/capitalize_first_letter.dart';

// ignore: must_be_immutable
class SearchPage extends HookConsumerWidget {
  SearchPage({Key? key}) : super(key: key);

  late FocusNode searchFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);
    final isSearchEnabled = ref.watch(searchPageStateProvider).isSearchEnabled;
    AsyncValue<List<CuratedLocation>> curatedLocation = ref.watch(getCuratedLocationProvider);
    AsyncValue<List<CuratedObject>> curatedObjects = ref.watch(getCuratedObjectProvider);

    useEffect(() {
      searchFocusNode = FocusNode();
      return () => searchFocusNode.dispose();
    }, []);

    _onSearchSubmitted(String searchTerm) async {
      searchFocusNode.unfocus();
      ref.watch(searchPageStateProvider.notifier).disableSearch();

      AutoRouter.of(context).push(SearchResultRoute(searchTerm: searchTerm));
    }

    _buildPlaces() {
      return curatedLocation.when(
        loading: () => const SizedBox(width: 60, height: 60, child: CircularProgressIndicator.adaptive()),
        error: (err, stack) => Text('Error: $err'),
        data: (curatedLocations) {
          return curatedLocations.isNotEmpty
              ? SizedBox(
                  height: MediaQuery.of(context).size.width / 2,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(left: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: curatedLocation.value?.length,
                    itemBuilder: ((context, index) {
                      CuratedLocation locationInfo = curatedLocations[index];
                      var thumbnailRequestUrl =
                          '${box.get(serverEndpointKey)}/asset/file?aid=${locationInfo.deviceAssetId}&did=${locationInfo.deviceId}&isThumb=true';

                      return ThumbnailWithInfo(
                        imageUrl: thumbnailRequestUrl,
                        textInfo: locationInfo.city,
                        onTap: () {
                          AutoRouter.of(context).push(SearchResultRoute(searchTerm: locationInfo.city));
                        },
                      );
                    }),
                  ),
                )
              : SizedBox(
                  height: MediaQuery.of(context).size.width / 2,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(left: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: 1,
                    itemBuilder: ((context, index) {
                      return ThumbnailWithInfo(
                        imageUrl:
                            'https://images.unsplash.com/photo-1612178537253-bccd437b730e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Ymxhbmt8ZW58MHx8MHx8&auto=format&fit=crop&w=700&q=60',
                        textInfo: 'No Places Info Available',
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
        loading: () => const SizedBox(width: 60, height: 60, child: CircularProgressIndicator.adaptive()),
        error: (err, stack) => Text('Error: $err'),
        data: (objects) {
          return objects.isNotEmpty
              ? SizedBox(
                  height: MediaQuery.of(context).size.width / 2,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(left: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: curatedObjects.value?.length,
                    itemBuilder: ((context, index) {
                      CuratedObject curatedObjectInfo = objects[index];
                      var thumbnailRequestUrl =
                          '${box.get(serverEndpointKey)}/asset/file?aid=${curatedObjectInfo.deviceAssetId}&did=${curatedObjectInfo.deviceId}&isThumb=true';

                      return ThumbnailWithInfo(
                        imageUrl: thumbnailRequestUrl,
                        textInfo: curatedObjectInfo.object,
                        onTap: () {
                          AutoRouter.of(context)
                              .push(SearchResultRoute(searchTerm: curatedObjectInfo.object.capitalizeFirstLetter()));
                        },
                      );
                    }),
                  ),
                )
              : SizedBox(
                  height: MediaQuery.of(context).size.width / 2,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(left: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: 1,
                    itemBuilder: ((context, index) {
                      return ThumbnailWithInfo(
                        imageUrl:
                            'https://images.unsplash.com/photo-1612178537253-bccd437b730e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Ymxhbmt8ZW58MHx8MHx8&auto=format&fit=crop&w=700&q=60',
                        textInfo: 'No Object Info Available',
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
              children: [
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    "Places",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                _buildPlaces(),
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    "Things",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                _buildThings()
              ],
            ),
            isSearchEnabled ? SearchSuggestionList(onSubmitted: _onSearchSubmitted) : Container(),
          ],
        ),
      ),
    );
  }
}
