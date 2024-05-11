import 'package:flutter/material.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info.dart';
import 'package:immich_mobile/entities/store.entity.dart';

class CuratedRow extends StatelessWidget {
  final List<SearchCuratedContent> content;
  final double imageSize;

  /// Callback with the content and the index when tapped
  final Function(SearchCuratedContent, int)? onTap;

  const CuratedRow({
    super.key,
    required this.content,
    this.imageSize = 200,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Guard empty [content]
    if (content.isEmpty) {
      // Return empty thumbnail
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
        final object = content[index];
        final thumbnailRequestUrl =
            '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/${object.id}';
        return SizedBox(
          width: imageSize,
          height: imageSize,
          child: Padding(
            padding: const EdgeInsets.only(right: 4.0),
            child: ThumbnailWithInfo(
              imageUrl: thumbnailRequestUrl,
              textInfo: object.label,
              onTap: () => onTap?.call(object, index),
            ),
          ),
        );
      },
      itemCount: content.length,
    );
  }
}
