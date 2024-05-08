import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/search/search_curated_content.model.dart';

import 'package:immich_mobile/services/search.service.dart';

final getPreviewPlacesProvider =
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

final getAllPlacesProvider =
    FutureProvider.autoDispose<List<SearchCuratedContent>>((ref) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  final assetPlaces = await searchService.getAllPlaces();

  if (assetPlaces == null) {
    return [];
  }

  final curatedContent = assetPlaces
      .map(
        (data) => SearchCuratedContent(
          label: data.exifInfo!.city!,
          id: data.id,
        ),
      )
      .toList();

  return curatedContent;
});
