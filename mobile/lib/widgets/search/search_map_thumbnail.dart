import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class SearchMapThumbnail extends StatelessWidget {
  const SearchMapThumbnail({
    super.key,
    this.size = 60.0,
  });

  final double size;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.pushRoute(
        const MapRoute(),
      ),
      child: SizedBox.square(
        dimension: size,
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
                height: size,
                width: size,
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
}
