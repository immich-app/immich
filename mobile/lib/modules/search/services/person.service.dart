import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

final personServiceProvider = Provider(
  (ref) => PersonService(
    ref.watch(apiServiceProvider),
  ),
);

class PersonService {
  final ApiService _apiService;

  PersonService(this._apiService);

  Future<List<PersonResponseDto>?> getCuratedPeople() async {
    try {
      return await _apiService.personApi.getAllPeople();
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
