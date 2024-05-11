import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/widgets/search/thumbnail_with_info.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class ExploreGrid extends StatelessWidget {
  final List<SearchCuratedContent> curatedContent;
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
