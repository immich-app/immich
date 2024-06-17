import 'package:flutter/material.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';
import 'package:immich_mobile/widgets/search/search_map_thumbnail.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info.dart';
import 'package:immich_mobile/entities/store.entity.dart';

class CuratedPlacesRow extends StatelessWidget {
  const CuratedPlacesRow({
    super.key,
    required this.content,
    required this.imageSize,
    this.isMapEnabled = true,
    this.onTap,
  });

  final bool isMapEnabled;
  final List<SearchCuratedContent> content;
  final double imageSize;

  /// Callback with the content and the index when tapped
  final Function(SearchCuratedContent, int)? onTap;

  @override
  Widget build(BuildContext context) {
    // Calculating the actual index of the content based on the whether map is enabled or not.
    // If enabled, inject map as the first item in the list (index 0) and so the actual content will start from index 1
    final int actualContentIndex = isMapEnabled ? 1 : 0;

    return SizedBox(
      height: imageSize,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
        ),
        itemBuilder: (context, index) {
          // Injecting Map thumbnail as the first element
          if (isMapEnabled && index == 0) {
            return SearchMapThumbnail(
              size: imageSize,
            );
          }
          final actualIndex = index - actualContentIndex;
          final object = content[actualIndex];
          final thumbnailRequestUrl =
              '${Store.get(StoreKey.serverEndpoint)}/assets/${object.id}/thumbnail';
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
      ),
    );
  }
}
