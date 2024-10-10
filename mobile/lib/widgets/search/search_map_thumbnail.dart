import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info_container.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class SearchMapThumbnail extends StatelessWidget {
  const SearchMapThumbnail({
    super.key,
    this.size = 60.0,
  });

  final double size;
  final bool showTitle = true;

  @override
  Widget build(BuildContext context) {
    return ThumbnailWithInfoContainer(
      label: 'search_page_your_map'.tr(),
      onTap: () {
        context.pushRoute(const MapRoute());
      },
      child: IgnorePointer(
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
    );
  }
}
