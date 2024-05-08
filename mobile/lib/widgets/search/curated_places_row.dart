import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:immich_mobile/widgets/search/curated_row.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class CuratedPlacesRow extends CuratedRow {
  final bool isMapEnabled;

  const CuratedPlacesRow({
    super.key,
    required super.content,
    this.isMapEnabled = true,
    super.imageSize,
    super.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Calculating the actual index of the content based on the whether map is enabled or not.
    // If enabled, inject map as the first item in the list (index 0) and so the actual content will start from index 1
    final int actualContentIndex = isMapEnabled ? 1 : 0;
    Widget buildMapThumbnail() {
      return GestureDetector(
        onTap: () => context.pushRoute(
          const MapRoute(),
        ),
        child: SizedBox.square(
          dimension: imageSize,
          child: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 10.0),
                child: MapThumbnail(
                  zoom: 2,
                  centre: const LatLng(
                    47,
                    5,
                  ),
                  height: imageSize,
                  width: imageSize,
                  showAttribution: false,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 10.0),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: Colors.black,
                    gradient: LinearGradient(
                      begin: FractionalOffset.topCenter,
                      end: FractionalOffset.bottomCenter,
                      colors: [
                        Colors.blueGrey.withOpacity(0.0),
                        Colors.black.withOpacity(0.4),
                      ],
                      stops: const [0.0, 0.4],
                    ),
                  ),
                ),
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: const Text(
                    "search_page_your_map",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ).tr(),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Return empty thumbnail
    if (!isMapEnabled && content.isEmpty) {
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

    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
      ),
      itemBuilder: (context, index) {
        // Injecting Map thumbnail as the first element
        if (isMapEnabled && index == 0) {
          return buildMapThumbnail();
        }
        final actualIndex = index - actualContentIndex;
        final object = content[actualIndex];
        final thumbnailRequestUrl =
            '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/${object.id}';
        return SizedBox(
          width: imageSize,
          height: imageSize,
          child: Padding(
            padding: const EdgeInsets.only(right: 10.0),
            child: ThumbnailWithInfo(
              imageUrl: thumbnailRequestUrl,
              textInfo: object.label,
              onTap: () => onTap?.call(object, actualIndex),
            ),
          ),
        );
      },
      itemCount: content.length + actualContentIndex,
    );
  }
}
