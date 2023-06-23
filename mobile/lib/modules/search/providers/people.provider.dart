import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/search/services/person.service.dart';
import 'package:openapi/api.dart';

final personAssetsProvider = FutureProvider.family
    .autoDispose<RenderList, String>((ref, personId) async {
  final PersonService personService = ref.watch(personServiceProvider);

  final assets = await personService.getPersonAssets(personId);

  if (assets == null) {
    return RenderList.empty();
  }

  return RenderList.fromAssets(assets, GroupAssetsBy.auto);
});

final getCuratedPeopleProvider =
    FutureProvider.autoDispose<List<PersonResponseDto>>((ref) async {
  final PersonService personService = ref.watch(personServiceProvider);

  final curatedPeople = await personService.getCuratedPeople();

  return curatedPeople ?? [];
});

class UpdatePersonName {
  final String id;
  final String name;

  UpdatePersonName(this.id, this.name);
}

final updatePersonNameProvider =
    StateProvider.family<void, UpdatePersonName>((ref, dto) async {
  final PersonService personService = ref.watch(personServiceProvider);

  final person = await personService.updateName(dto.id, dto.name);

  if (person != null && person.name == dto.name) {
    ref.invalidate(getCuratedPeopleProvider);
  }
});
