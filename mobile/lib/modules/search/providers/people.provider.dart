import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/services/person.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'people.provider.g.dart';

@riverpod
Future<RenderList> personAssets(PersonAssetsRef ref, String personId) async {
  final PersonService personService = ref.read(personServiceProvider);

  final assets = await personService.getPersonAssets(personId);

  if (assets == null) {
    return RenderList.empty();
  }

  return RenderList.fromAssets(assets, GroupAssetsBy.auto);
}

@riverpod
Future<List<CuratedContent>> getCuratedPeople(
  GetCuratedPeopleRef ref,
) async {
  final PersonService personService = ref.read(personServiceProvider);

  final curatedPeople = await personService.getCuratedPeople();

  return curatedPeople
          ?.map((p) => CuratedContent(id: p.id, label: p.name))
          .toList() ??
      [];
}

@riverpod
void updatePersonName(
  UpdatePersonNameRef ref,
  String id,
  String personName,
) async {
  final PersonService personService = ref.read(personServiceProvider);

  final person = await personService.updateName(id, personName);

  if (person != null && person.name == personName) {
    ref.invalidate(getCuratedPeopleProvider);
  }
}
