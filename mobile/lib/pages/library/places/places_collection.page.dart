import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/search/search_page_state.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/calculate_distance.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

enum FilterType {
  name,
  distance,
}

@RoutePage()
class PlacesCollectionPage extends HookConsumerWidget {
  const PlacesCollectionPage({super.key, this.currentLocation});
  final LatLng? currentLocation;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final places = ref.watch(getAllPlacesProvider);
    final formFocus = useFocusNode();
    final ValueNotifier<String?> search = useState(null);
    final filterType = useState(FilterType.name);
    final isAscending = useState(true); // Add state for sort order

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: search.value == null,
        title: search.value != null
            ? SearchField(
                autofocus: true,
                filled: true,
                focusNode: formFocus,
                onChanged: (value) => search.value = value,
                onTapOutside: (_) => formFocus.unfocus(),
                hintText: 'filter_places'.tr(),
              )
            : Text('places'.tr()),
        actions: [
          IconButton(
            icon: Icon(search.value != null ? Icons.close : Icons.search),
            onPressed: () {
              search.value = search.value == null ? '' : null;
            },
          ),
        ],
      ),
      body: ListView(
        shrinkWrap: true,
        children: [
          if (search.value == null) ...[
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                height: 200,
                child: MapThumbnail(
                  onTap: (_, __) => context
                      .pushRoute(MapRoute(initialLocation: currentLocation)),
                  zoom: 8,
                  centre: currentLocation ??
                      const LatLng(
                        21.44950,
                        -157.91959,
                      ),
                  showAttribution: false,
                  themeMode:
                      context.isDarkTheme ? ThemeMode.dark : ThemeMode.light,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0),
              child: Row(
                spacing: 8.0,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (currentLocation != null) ...[
                    Text('sort_places_by'.tr()),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8.0),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: Theme.of(context)
                                .colorScheme
                                .surfaceContainerHighest,
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(8.0),
                        ),
                        child: DropdownButton(
                          value: filterType.value,
                          items: [
                            DropdownMenuItem(
                              value: FilterType.name,
                              child: Text('name'.tr()),
                            ),
                            DropdownMenuItem(
                              value: FilterType.distance,
                              child: Text('distance'.tr()),
                            ),
                          ],
                          onChanged: (e) {
                            filterType.value = e!;
                          },
                          isExpanded: false,
                          underline: const SizedBox(),
                          style: const TextStyle(
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                  IconButton(
                    icon: const Icon(
                      Icons.swap_vert,
                    ),
                    onPressed: () {
                      isAscending.value = !isAscending.value;
                    },
                  ),
                ],
              ),
            ),
          ],
          places.when(
            data: (places) {
              if (search.value != null) {
                places = places.where((place) {
                  return place.label
                      .toLowerCase()
                      .contains(search.value!.toLowerCase());
                }).toList();
              } else {
                // Sort based on the selected filter type
                places = List.from(places);

                if (filterType.value == FilterType.distance &&
                    currentLocation != null) {
                  // Sort places by distance
                  places.sort((a, b) {
                    final double distanceA = calculateDistance(
                      currentLocation!.latitude,
                      currentLocation!.longitude,
                      a.latitude,
                      a.longitude,
                    );
                    final double distanceB = calculateDistance(
                      currentLocation!.latitude,
                      currentLocation!.longitude,
                      b.latitude,
                      b.longitude,
                    );

                    return isAscending.value
                        ? distanceA.compareTo(distanceB)
                        : distanceB.compareTo(distanceA);
                  });
                } else {
                  // Sort places by name
                  places.sort(
                    (a, b) => isAscending.value
                        ? a.label.toLowerCase().compareTo(b.label.toLowerCase())
                        : b.label
                            .toLowerCase()
                            .compareTo(a.label.toLowerCase()),
                  );
                }
              }
              return ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: places.length,
                itemBuilder: (context, index) {
                  final place = places[index];

                  return PlaceTile(id: place.id, name: place.label);
                },
              );
            },
            error: (error, stask) => const Text('Error getting places'),
            loading: () => const Center(child: CircularProgressIndicator()),
          ),
        ],
      ),
    );
  }
}

class PlaceTile extends StatelessWidget {
  const PlaceTile({super.key, required this.id, required this.name});

  final String id;
  final String name;

  @override
  Widget build(BuildContext context) {
    final thumbnailUrl =
        '${Store.get(StoreKey.serverEndpoint)}/assets/$id/thumbnail';

    void navigateToPlace() {
      context.pushRoute(
        SearchRoute(
          prefilter: SearchFilter(
            people: {},
            location: SearchLocationFilter(
              city: name,
            ),
            camera: SearchCameraFilter(),
            date: SearchDateFilter(),
            display: SearchDisplayFilters(
              isNotInAlbum: false,
              isArchive: false,
              isFavorite: false,
            ),
            mediaType: AssetType.other,
          ),
        ),
      );
    }

    return LargeLeadingTile(
      onTap: () => navigateToPlace(),
      title: Text(
        name,
        style: context.textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: CachedNetworkImage(
          width: 80,
          height: 80,
          fit: BoxFit.cover,
          imageUrl: thumbnailUrl,
          httpHeaders: ApiService.getRequestHeaders(),
          errorWidget: (context, url, error) =>
              const Icon(Icons.image_not_supported_outlined),
        ),
      ),
    );
  }
}
