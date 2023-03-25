import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/shared/models/store.dart';

class ExploreGrid extends StatelessWidget {
  final List<CuratedContent> curatedContent;
  final Function(CuratedContent, int)? onTap;

  const ExploreGrid({
    super.key,
    required this.curatedContent,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (curatedContent.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: SizedBox(
          height: 100,
          width: 100,
          child: ThumbnailWithInfo(
            textInfo: '',
            onTap: () {
            },
          ),
        ),
      );
    }

    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 140,
        mainAxisSpacing: 4,
        crossAxisSpacing: 4,
      ),
      itemBuilder: (context, index) {
        final content = curatedContent[index];
        final thumbnailRequestUrl =
            '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/${content.id}';
        return ThumbnailWithInfo(
          imageUrl: thumbnailRequestUrl,
          textInfo: content.label,
          onTap: () => onTap?.call(content, index),
        );
      },
      itemCount: curatedContent.length,
    );
  }

}
