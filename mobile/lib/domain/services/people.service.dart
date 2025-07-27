import 'dart:async';

import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/repositories/people.repository.dart';
import 'package:immich_mobile/repositories/person_api.repository.dart';

class DriftPeopleService {
  final DriftPeopleRepository _repository;
  final PersonApiRepository _personApiRepository;

  const DriftPeopleService(this._repository, this._personApiRepository);

  Future<List<DriftPerson>> getAssetPeople(String assetId) async {
    final people = await _repository.getAssetPeople(assetId);
    return people;
  }

  Future<List<DriftPerson>> getAllPeople() async {
    final people = await _repository.getAllPeople();
    return people;
  }

  Future<int> updateName(String personId, String name) async {
    await _personApiRepository.update(personId, name: name);
    return _repository.updateName(personId, name);
  }
}
