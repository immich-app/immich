import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/services/person.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'people.provider.g.dart';

@riverpod
Future<List<PersonDto>> getAllPeople(Ref ref) async {
  final PersonService personService = ref.read(personServiceProvider);

  final people = await personService.getAllPeople();

  return people;
}

@riverpod
Future<bool> updatePersonName(Ref ref, String personId, String updatedName) async {
  final PersonService personService = ref.read(personServiceProvider);
  final person = await personService.updateName(personId, updatedName);

  if (person != null && person.name == updatedName) {
    ref.invalidate(getAllPeopleProvider);
    return true;
  }
  return false;
}
