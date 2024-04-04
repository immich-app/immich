import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/models/search_filter.dart';
import 'package:immich_mobile/modules/search/ui/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
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
                ? context.pushRoute(
                    PersonResultRoute(
                      personId: content.id,
                      personName: content.label,
                    ),
                  )
                : context.pushRoute(
                    SearchInputRoute(
                      prefilter: SearchFilter(
                        people: {},
                        location: SearchLocationFilter(
                          city: content.label,
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
          },
        );
      },
      itemCount: curatedContent.length,
    );
  }
}
