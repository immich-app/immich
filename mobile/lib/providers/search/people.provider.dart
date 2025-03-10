import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/services/person.service.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'people.provider.g.dart';

@riverpod
Future<List<Person>> getAllPeople(
  Ref ref,
) async {
  final PersonService personService = ref.read(personServiceProvider);

  final people = await personService.getAllPeople();

  return people;
}

@riverpod
Future<RenderList> personAssets(Ref ref, String personId) async {
  final PersonService personService = ref.read(personServiceProvider);
  final assets = await personService.getPersonAssets(personId);

  final settings = ref.read(appSettingsServiceProvider);
  final groupBy =
      GroupAssetsBy.values[settings.getSetting(AppSettingsEnum.groupAssetsBy)];
  return await RenderList.fromAssets(assets, groupBy);
}

@riverpod
Future<bool> updatePersonName(
  Ref ref,
  String personId,
  String updatedName,
) async {
  final PersonService personService = ref.read(personServiceProvider);
  final person = await personService.updateName(personId, updatedName);

  if (person != null && person.name == updatedName) {
    ref.invalidate(getAllPeopleProvider);
    return true;
  }
  return false;
}
