import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';

import 'package:immich_mobile/widgets/common/immich_search_bar.dart';
import 'package:immich_mobile/presentation/pages/search/paginated_search.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/models/search/search_filter.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/domain/models/person.model.dart';

@RoutePage()
class MainTimelinePage extends ConsumerWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasMemories = ref.watch(driftMemoryFutureProvider.select((state) => state.value?.isNotEmpty ?? false));

    void onSearchSubmitted(String query) {
      if (query.isEmpty) {
        return;
      }
      final preFilter = SearchFilter(
        filename: '',
        description: '',
        ocr: '',
        context: query,
        people: {},
        display: SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
        location: SearchLocationFilter(),
        mediaType: AssetType.other,
        rating: SearchRatingFilter(),
        camera: SearchCameraFilter(),
        date: SearchDateFilter(),
      );

      ref.read(searchPreFilterProvider.notifier).setFilter(preFilter);
      context.navigateTo(const DriftSearchRoute());
    }

    void onPeopleSubmitted(Set<PersonDto> people) {
      final preFilter = SearchFilter(
        filename: '',
        description: '',
        ocr: '',
        context: '',
        people: people,
        display: SearchDisplayFilters(isNotInAlbum: false, isArchive: false, isFavorite: false),
        location: SearchLocationFilter(),
        mediaType: AssetType.other,
        rating: SearchRatingFilter(),
        camera: SearchCameraFilter(),
        date: SearchDateFilter(),
      );

      ref.read(searchPreFilterProvider.notifier).setFilter(preFilter);
      context.navigateTo(const DriftSearchRoute());
    }

    return Timeline(
      topSliverWidget: SliverToBoxAdapter(
        child: Column(
          children: [
            ImmichSearchBar(onSubmitted: onSearchSubmitted, onPeopleSubmitted: onPeopleSubmitted),
            if (hasMemories) const DriftMemoryLane(),
          ],
        ),
      ),
      topSliverWidgetHeight: (hasMemories ? 200 : 0) + 80,
      showStorageIndicator: true,
    );
  }
}
