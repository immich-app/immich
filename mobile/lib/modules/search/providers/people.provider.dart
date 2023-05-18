import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/search/services/search.service.dart';
import 'package:openapi/api.dart';

final getPersonAssetsProvider = FutureProvider.family
    .autoDispose<List<AssetResponseDto>, String>((ref, personId) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  var assets = await searchService.getPersonAssets(personId);

  return assets ?? [];
});

final getCuratedPeopleProvider =
    FutureProvider.autoDispose<List<PersonResponseDto>>((ref) async {
  final SearchService searchService = ref.watch(searchServiceProvider);

  var curatedPeople = await searchService.getCuratedPeople();

  return curatedPeople ?? [];
});
