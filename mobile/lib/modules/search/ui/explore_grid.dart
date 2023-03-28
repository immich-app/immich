import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/store.dart';

class ExploreGrid extends StatelessWidget {
  final List<CuratedContent> curatedContent;
  const ExploreGrid({
    super.key,
    required this.curatedContent,
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
            onTap: () {},
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
          borderRadius: 0,
          onTap: () {
            AutoRouter.of(context).push(
              SearchResultRoute(searchTerm: 'm:${content.label}'),
            );
          },
        );
      },
      itemCount: curatedContent.length,
    );
  }
}
