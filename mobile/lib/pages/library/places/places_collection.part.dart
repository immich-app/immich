import 'package:auto_route/auto_route.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/search/search_page_state.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

@RoutePage()
class PlacesCollectionPage extends HookConsumerWidget {
  const PlacesCollectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final places = ref.watch(getAllPlacesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('places'.tr()),
      ),
      body: ListView(
        shrinkWrap: true,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              height: 200,
              width: context.width,
              child: MapThumbnail(
                onTap: (_, __) => context.pushRoute(const MapRoute()),
                zoom: 8,
                centre: const LatLng(
                  21.44950,
                  -157.91959,
                ),
                showAttribution: false,
                themeMode:
                    context.isDarkTheme ? ThemeMode.dark : ThemeMode.light,
              ),
            ),
          ),
          places.when(
            data: (places) {
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
            loading: () => Center(child: const CircularProgressIndicator()),
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
        SearchInputRoute(
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
