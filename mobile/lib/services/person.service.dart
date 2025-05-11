import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/interfaces/asset_api.interface.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/person_api.repository.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'person.service.g.dart';

@riverpod
PersonService personService(Ref ref) => PersonService(
      ref.watch(personApiRepositoryProvider),
      ref.watch(assetApiRepositoryProvider),
      ref.read(assetRepositoryProvider),
    );

class PersonService {
  final Logger _log = Logger("PersonService");
  final IPersonApiRepository _personApiRepository;
  final IAssetApiRepository _assetApiRepository;
  final IAssetRepository _assetRepository;

  PersonService(
    this._personApiRepository,
    this._assetApiRepository,
    this._assetRepository,
  );

  Future<List<Person>> getAllPeople() async {
    try {
      return await _personApiRepository.getAll();
    } catch (error, stack) {
      _log.severe("Error while fetching curated people", error, stack);
      return [];
    }
  }

  Future<List<Asset>> getPersonAssets(String id) async {
    try {
      final assets = await _assetApiRepository.search(personIds: [id]);
      return await _assetRepository
          .getAllByRemoteId(assets.map((a) => a.remoteId!));
    } catch (error, stack) {
      _log.severe("Error while fetching person assets", error, stack);
    }
    return [];
  }

  Future<Person?> updateName(String id, String name) async {
    try {
      return await _personApiRepository.update(id, name: name);
    } catch (error, stack) {
      _log.severe("Error while updating person name", error, stack);
    }
    return null;
  }
}
