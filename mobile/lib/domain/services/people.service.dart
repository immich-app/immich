import 'dart:async';

import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/repositories/people.repository.dart';
import 'package:immich_mobile/repositories/person_api.repository.dart';

class DriftPeopleService {
  final DriftPeopleRepository _repository;
  final PersonApiRepository _personApiRepository;

  const DriftPeopleService(this._repository, this._personApiRepository);

  Future<DriftPerson?> get(String personId) {
    return _repository.get(personId);
  }

  Future<List<DriftPerson>> getAssetPeople(String assetId) {
    return _repository.getAssetPeople(assetId);
  }

  Future<List<DriftPerson>> getAllPeople({int minFaces = 3}) {
    return _repository.getAllPeople(minFaces: minFaces);
  }

  Future<int> updateName(String personId, String name) async {
    await _personApiRepository.update(personId, name: name);
    return _repository.updateName(personId, name);
  }

  Future<int> updateBrithday(String personId, DateTime birthday) async {
    await _personApiRepository.update(personId, birthday: birthday);
    return _repository.updateBirthday(personId, birthday);
  }

  Future<({int merged, int failed})> mergePerson(String targetPersonId, List<String> personIdsToMerge) async {
    if (personIdsToMerge.isEmpty) {
      return (merged: 0, failed: 0);
    }

    final mergedIds = await _personApiRepository.mergePerson(targetPersonId, personIdsToMerge);
    final failed = personIdsToMerge.length - mergedIds.length;

    if (mergedIds.isNotEmpty) {
      final updatedTarget = await _personApiRepository.getById(targetPersonId);
      await _repository.mergePeople(
        targetPersonId,
        mergedIds,
        name: updatedTarget.name,
        birthDate: updatedTarget.birthDate,
      );
    }

    return (merged: mergedIds.length, failed: failed);
  }
}
