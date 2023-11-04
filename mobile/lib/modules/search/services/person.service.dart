import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'person.service.g.dart';

@riverpod
PersonService personService(PersonServiceRef ref) {
  return PersonService(ref.read(apiServiceProvider));
}

class PersonService {
  final ApiService _apiService;

  PersonService(this._apiService);

  Future<List<PersonResponseDto>?> getCuratedPeople() async {
    try {
      final peopleResponseDto = await _apiService.personApi.getAllPeople();
      return peopleResponseDto?.people;
    } catch (e) {
      debugPrint("Error [getCuratedPeople] ${e.toString()}");
      return null;
    }
  }

  Future<List<Asset>?> getPersonAssets(String id) async {
    try {
      final assets = await _apiService.personApi.getPersonAssets(id);

      if (assets == null) {
        return null;
      }

      return assets.map((e) => Asset.remote(e)).toList();
    } catch (e) {
      debugPrint("Error [getPersonAssets] ${e.toString()}");
      return null;
    }
  }

  Future<PersonResponseDto?> updateName(String id, String name) async {
    try {
      return await _apiService.personApi.updatePerson(
        id,
        PersonUpdateDto(
          name: name,
        ),
      );
    } catch (e) {
      debugPrint("Error [updateName] ${e.toString()}");
      return null;
    }
  }
}
