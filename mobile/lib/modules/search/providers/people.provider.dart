import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/search/models/curated_content.dart';
import 'package:immich_mobile/modules/search/services/person.service.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'people.provider.g.dart';

@riverpod
Future<List<CuratedContent>> getCuratedPeople(
  GetCuratedPeopleRef ref,
) async {
  final PersonService personService = ref.read(personServiceProvider);

  final curatedPeople = await personService.getCuratedPeople();

  return curatedPeople
      .map((p) => CuratedContent(id: p.id, label: p.name))
      .toList();
}

@riverpod
Future<RenderList> personAssets(PersonAssetsRef ref, String personId) async {
  final PersonService personService = ref.read(personServiceProvider);
  final assets = await personService.getPersonAssets(personId);
  if (assets == null) {
    return RenderList.empty();
  }

  final settings = ref.read(appSettingsServiceProvider);
  final groupBy =
      GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)];
  return await RenderList.fromAssets(assets, groupBy);
}

@riverpod
Future<bool> updatePersonName(
  UpdatePersonNameRef ref,
  String personId,
  String updatedName,
) async {
  final PersonService personService = ref.read(personServiceProvider);
  final person = await personService.updateName(personId, updatedName);

  if (person != null && person.name == updatedName) {
    ref.invalidate(getCuratedPeopleProvider);
    return true;
  }
  return false;
}
