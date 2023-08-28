import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/map/ui/map_thumbnail.dart';
import 'package:immich_mobile/modules/search/ui/curated_row.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:latlong2/latlong.dart';

class CuratedPlacesRow extends CuratedRow {
  const CuratedPlacesRow({
    super.key,
    required super.content,
    super.imageSize,
    super.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget buildMapThumbnail() {
      return GestureDetector(
        onTap: () => AutoRouter.of(context).push(
          const MapRoute(),
        ),
        child: SizedBox(
          height: imageSize,
          width: imageSize,
          child: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 10.0),
                child: MapThumbnail(
                  zoom: 2,
                  coords: LatLng(
                    47,
                    5,
                  ),
                  height: imageSize,
                  showAttribution: false,
                  isDarkTheme: Theme.of(context).brightness == Brightness.dark,
                ),
              ),
              Container(
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
                    stops: const [0.0, 1.0],
                  ),
                ),
              ),
              const Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: EdgeInsets.only(bottom: 10),
                  child: Text(
                    "Your Map",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
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
        if (index == 0) {
          return buildMapThumbnail();
        }
        // The actual index is 1 less than the virutal index since we inject map into the first position
        final actualIndex = index - 1;
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
      // Adding 1 to inject map thumbnail as first element
      itemCount: content.length + 1,
    );
  }
}
