import 'dart:async';

import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/repositories/people.repository.dart';
import 'package:immich_mobile/repositories/person_api.repository.dart';
import 'package:openapi/api.dart';

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

  Future<List<DriftPerson>> getAllPeople() {
    return _repository.getAllPeople();
  }

  Future<List<DriftPerson>> getAllPeopleWithHidden() {
    return _personApiRepository.getAllWithHidden();
  }

  Future<int> updateName(String personId, String name) async {
    await _personApiRepository.update(personId, name: name);
    return _repository.updateName(personId, name);
  }

  Future<int> updateBrithday(String personId, DateTime birthday) async {
    await _personApiRepository.update(personId, birthday: birthday);
    return _repository.updateBirthday(personId, birthday);
  }

  Future<void> updatePeopleHidden(List<PeopleUpdateItem> updates) async {
    await _personApiRepository.updatePeople(updates);
    // Update local DB so invalidate reflects the change immediately
    for (final u in updates) {
      if (u.isHidden != null) {
        await _repository.updateIsHidden(u.id, u.isHidden!);
      }
    }
  }

  Future<void> mergePerson(String targetId, List<String> sourceIds) async {
    // Step 0: Prefetch local records (used for field inheritance)
    final targetPerson = await _repository.get(targetId);
    final sourcePersons = await Future.wait(sourceIds.map((id) => _repository.get(id)));
    final validSources = sourcePersons.whereType<DriftPerson>().toList();

    if (targetPerson == null) {
      throw Exception('Target person not found locally');
    }

    // Step 1: Call backend API (merge is performed on the server)
    await _personApiRepository.mergePerson(targetId, sourceIds);

    // Step 2: Immediate local update (optimistic update: apply only after API succeeds)
    // 2.1 Bulk-update asset_face: reassign all source-person faces to target
    if (validSources.isNotEmpty) {
      final sourceIdList = validSources.map((p) => p.id).toList();
      await _repository.reassignAllFaces(sourceIdList, targetId);
    }

    // 2.2 Update target-person fields (inherit name/birthDate: only when target is empty, use first non-empty source)
    String? inheritedName;
    DateTime? inheritedBirthday;

    if (targetPerson.name.isEmpty) {
      for (final p in validSources) {
        if (p.name.isNotEmpty) {
          inheritedName = p.name;
          break;
        }
      }
      if (inheritedName == null && validSources.isNotEmpty) {
        inheritedName = validSources.first.name;
      }
    }

    if (targetPerson.birthDate == null) {
      for (final p in validSources) {
        if (p.birthDate != null) {
          inheritedBirthday = p.birthDate;
          break;
        }
      }
    }

    if (inheritedName != null || inheritedBirthday != null) {
      await _repository.updatePersonFields(targetId, name: inheritedName, birthDate: inheritedBirthday);
    }

    // 2.3 Finally delete old local persons (reassign first to avoid ON DELETE SET NULL side effects)
    for (final id in sourceIds) {
      await _repository.deletePerson(id);
    }
  }
}
