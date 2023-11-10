import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class ExploreGrid extends StatelessWidget {
  final List<CuratedContent> curatedContent;
  final bool isPeople;

  const ExploreGrid({
    super.key,
    required this.curatedContent,
    this.isPeople = false,
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
        final thumbnailRequestUrl = isPeople
            ? getFaceThumbnailUrl(content.id)
            : '${Store.get(StoreKey.serverEndpoint)}/asset/thumbnail/${content.id}';

        return ThumbnailWithInfo(
          imageUrl: thumbnailRequestUrl,
          textInfo: content.label,
          borderRadius: 0,
          onTap: () {
            isPeople
                ? context.autoPush(
                    PersonResultRoute(
                      personId: content.id,
                      personName: content.label,
                    ),
                  )
                : context.autoPush(
                    SearchResultRoute(searchTerm: 'm:${content.label}'),
                  );
          },
        );
      },
      itemCount: curatedContent.length,
    );
  }
}
