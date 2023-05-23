import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/search/services/search.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:openapi/api.dart';

final personAssetsProvider = FutureProvider.family
    .autoDispose<RenderList, String>((ref, personId) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  var assets = await searchService.getPersonAssets(personId);

  if (assets == null) {
    return RenderList.empty();
  }

  var convertToAsset = assets.map((e) => Asset.remote(e)).toList();

  return RenderList.fromAssets(convertToAsset, GroupAssetsBy.auto);
});

final getCuratedPeopleProvider =
    FutureProvider.autoDispose<List<PersonResponseDto>>((ref) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  var curatedPeople = await searchService.getCuratedPeople();

  return curatedPeople ?? [];
});
