import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/search/services/person.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:openapi/api.dart';

final personAssetsProvider = FutureProvider.family
    .autoDispose<RenderList, String>((ref, personId) async {
  final PersonService personService = ref.watch(personServiceProvider);

  final assetDtos = await personService.getPersonAssets(personId);

  if (assetDtos == null) {
    return RenderList.empty();
  }

  final convertToAsset = assetDtos.map((e) => Asset.remote(e)).toList();

  return RenderList.fromAssets(convertToAsset, GroupAssetsBy.auto);
});

final getCuratedPeopleProvider =
    FutureProvider.autoDispose<List<PersonResponseDto>>((ref) async {
  final PersonService personService = ref.watch(personServiceProvider);

  final curatedPeople = await personService.getCuratedPeople();

  return curatedPeople ?? [];
});

class UpdatePersonNameDto {
  final String id;
  final String name;

  UpdatePersonNameDto(this.id, this.name);
}

final updatePersonNameProvider =
    StateProvider.family<void, UpdatePersonNameDto>((ref, dto) async {
  final PersonService personService = ref.watch(personServiceProvider);

  var person = await personService.updateName(dto.id, dto.name);

  if (person != null && person.name == dto.name) {
    ref.invalidate(getCuratedPeopleProvider);
  }
});
