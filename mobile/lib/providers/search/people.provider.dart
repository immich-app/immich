import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/services/person.service.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'people.provider.g.dart';

@riverpod
Future<List<Person>> getAllPeople(Ref ref, {bool withHidden = false}) {
  final PersonService personService = ref.read(personServiceProvider);

  return personService.getAllPeople(withHidden: withHidden);
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

@riverpod
Future<bool> updatePersonIsHidden(
  Ref ref,
  String personId,
  bool isHidden,
) async {
  final PersonService personService = ref.read(personServiceProvider);
  final person = await personService.updateIsHidden(personId, isHidden);
  if (person != null && person.isHidden == isHidden) {
    ref.invalidate(getAllPeopleProvider);
    return true;
  }
  return false;
}
