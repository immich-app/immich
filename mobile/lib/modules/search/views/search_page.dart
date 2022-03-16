import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/search/models/curated_location.model.dart';
import 'package:immich_mobile/modules/search/providers/search_page_state.provider.dart';
import 'package:immich_mobile/modules/search/ui/search_bar.dart';
import 'package:immich_mobile/modules/search/ui/search_suggestion_list.dart';
import 'package:immich_mobile/routing/router.dart';

// ignore: must_be_immutable
class SearchPage extends HookConsumerWidget {
  SearchPage({Key? key}) : super(key: key);

  late FocusNode searchFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);
    final isSearchEnabled = ref.watch(searchPageStateProvider).isSearchEnabled;
    AsyncValue<List<CuratedLocation>> curatedLocation = ref.watch(getCuratedLocationProvider);

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
        loading: () => const CircularProgressIndicator(),
        error: (err, stack) => Text('Error: $err'),
        data: (curatedLocations) {
          return curatedLocations.isNotEmpty
              ? SizedBox(
                  height: MediaQuery.of(context).size.width / 3,
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
                  height: MediaQuery.of(context).size.width / 3,
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
              ],
            ),
            isSearchEnabled ? SearchSuggestionList(onSubmitted: _onSearchSubmitted) : Container(),
          ],
        ),
      ),
    );
  }
}

class ThumbnailWithInfo extends StatelessWidget {
  const ThumbnailWithInfo({Key? key, required this.textInfo, required this.imageUrl, required this.onTap})
      : super(key: key);

  final String textInfo;
  final String imageUrl;
  final Function onTap;

  @override
  Widget build(BuildContext context) {
    var box = Hive.box(userInfoBox);

    return GestureDetector(
      onTap: () {
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.only(right: 8.0),
        child: SizedBox(
          width: MediaQuery.of(context).size.width / 3,
          height: MediaQuery.of(context).size.width / 3,
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Container(
                foregroundDecoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.black26,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                    width: 150,
                    height: 150,
                    fit: BoxFit.cover,
                    imageUrl: imageUrl,
                    httpHeaders: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                left: 10,
                child: SizedBox(
                  width: MediaQuery.of(context).size.width / 3,
                  child: Text(
                    textInfo,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
