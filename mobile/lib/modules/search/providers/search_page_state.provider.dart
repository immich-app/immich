import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/search/search_curated_content.model.dart';

import 'package:immich_mobile/modules/search/services/search.service.dart';

final getPlacesProvider =
    FutureProvider.autoDispose<List<SearchCuratedContent>>((ref) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  final exploreData = await searchService.getExploreData();

  if (exploreData == null) {
    return [];
  }

  final locations =
      exploreData.firstWhere((data) => data.fieldName == "exifInfo.city").items;

  final curatedContent = locations
      .map(
        (l) => SearchCuratedContent(
          label: l.value,
          id: l.data.id,
        ),
      )
      .toList();

  return curatedContent;
});
