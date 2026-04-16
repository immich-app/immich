import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/repositories/person_api.repository.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'person.service.g.dart';

@riverpod
PersonService personService(Ref ref) => PersonService(ref.watch(personApiRepositoryProvider));

class PersonService {
  final Logger _log = Logger("PersonService");
  final PersonApiRepository _personApiRepository;
  PersonService(this._personApiRepository);

  Future<List<PersonDto>> getAllPeople() async {
    try {
      return await _personApiRepository.getAll();
    } catch (error, stack) {
      _log.severe("Error while fetching curated people", error, stack);
      return [];
    }
  }

  Future<PersonDto?> updateName(String id, String name) async {
    try {
      return await _personApiRepository.update(id, name: name);
    } catch (error, stack) {
      _log.severe("Error while updating person name", error, stack);
    }
    return null;
  }
}
