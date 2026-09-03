import 'dart:async';

import 'package:immich_mobile/data/db/main/dao/person.dart';
import 'package:immich_mobile/data/server/person.dart';
import 'package:immich_mobile/domain/models/person.model.dart';

/// Accesses People; entities mapped to assets for presence and face detection
class PeopleService {
  final PeopleRepository _repository;
  final PersonApiRepository _personApiRepository;

  const PeopleService(this._repository, this._personApiRepository);

  Future<Person?> get(String personId) {
    return _repository.get(personId);
  }

  Future<List<Person>> getAssetPeople(String assetId) {
    return _repository.getAssetPeople(assetId);
  }

  Stream<Person?> watchPersonById(String personId) {
    return _repository.watchPersonById(personId);
  }

  Stream<List<Person>> watch({int minFaces = 3}) {
    return _repository.watch(minFaces: minFaces);
  }

  Future<int> updateName(String personId, String name) async {
    await _personApiRepository.update(personId, name: name);
    return _repository.updateName(personId, name);
  }

  Future<List<String>> merge({required String targetPersonId, required List<String> mergePersonIds}) async {
    final mergedIds = await _personApiRepository.merge(targetPersonId, mergePersonIds);
    if (mergedIds.isNotEmpty) {
      await _repository.merge(targetPersonId, mergedIds);
    }

    return mergedIds;
  }

  Future<int> updateBirthday(String personId, DateTime birthday) async {
    await _personApiRepository.update(personId, birthday: birthday);
    return _repository.updateBirthday(personId, birthday);
  }
}
