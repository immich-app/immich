import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'person.service.g.dart';

@riverpod
PersonService personService(PersonServiceRef ref) =>
    PersonService(ref.read(apiServiceProvider), ref.read(dbProvider));

class PersonService {
  final Logger _log = Logger("PersonService");
  final ApiService _apiService;
  final Isar _db;

  PersonService(this._apiService, this._db);

  Future<List<PersonResponseDto>> getAllPeople() async {
    try {
      final peopleResponseDto = await _apiService.personApi.getAllPeople();
      return peopleResponseDto?.people ?? [];
    } catch (error, stack) {
      _log.severe("Error while fetching curated people", error, stack);
      return [];
    }
  }

  Future<List<Asset>?> getPersonAssets(String id) async {
    try {
      final assets = await _apiService.personApi.getPersonAssets(id);
      if (assets == null) return null;
      return await _db.assets.getAllByRemoteId(assets.map((e) => e.id));
    } catch (error, stack) {
      _log.severe("Error while fetching person assets", error, stack);
    }
    return null;
  }

  Future<PersonResponseDto?> updateName(String id, String name) async {
    try {
      return await _apiService.personApi.updatePerson(
        id,
        PersonUpdateDto(
          name: name,
        ),
      );
    } catch (error, stack) {
      _log.severe("Error while updating person name", error, stack);
    }
    return null;
  }
}
