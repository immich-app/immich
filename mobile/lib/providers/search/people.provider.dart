import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/services/person.service.dart';

final getAllPeopleProvider = FutureProvider.autoDispose<List<PersonDto>>((ref) async {
  final PersonService personService = ref.read(personServiceProvider);

  final people = await personService.getAllPeople();

  return people;
});

final updatePersonNameProvider = FutureProvider.autoDispose(
  (ref) => (String personId, String updatedName) async {
    final PersonService personService = ref.read(personServiceProvider);
    final person = await personService.updateName(personId, updatedName);

    if (person != null && person.name == updatedName) {
      ref.invalidate(getAllPeopleProvider);
      return true;
    }
    return false;
  },
);
