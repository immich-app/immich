import 'dart:async';

import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/repositories/people.repository.dart';
import 'package:immich_mobile/repositories/person_api.repository.dart';

class DriftPeopleService {
  final DriftPeopleRepository _repository;
  final PersonApiRepository _personApiRepository;

  const DriftPeopleService(this._repository, this._personApiRepository);

  Future<List<DriftPerson>> getAssetPeople(String assetId) {
    return _repository.getAssetPeople(assetId);
  }

  Stream<DriftPerson?> watchPersonById(String personId) {
    return _repository.watchPersonById(personId);
  }

  Future<List<DriftPerson>> getAllPeople() {
    return _repository.getAllPeople();
  }

  Future<int> updateName(String personId, String name) async {
    await _personApiRepository.update(personId, name: name);
    return _repository.updateName(personId, name);
  }

  Future<int> mergePeople({required String targetPersonId, required List<String> mergePersonIds}) async {
    await _personApiRepository.merge(targetPersonId, mergePersonIds);
    return _repository.mergePeople(targetPersonId, mergePersonIds);
  }

  Future<int> updateBrithday(String personId, DateTime birthday) async {
    await _personApiRepository.update(personId, birthday: birthday);
    return _repository.updateBirthday(personId, birthday);
  }
}
