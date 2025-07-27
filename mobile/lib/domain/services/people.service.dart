import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/repositories/person.repository.dart';

class DriftPeopleService {
  final DriftPeopleRepository _repository;

  const DriftPeopleService(this._repository);

  Future<List<DriftPeople>> getAssetPeople(String assetId) async {
    final people = await _repository.getAssetPeople(assetId);
    return people;
  }
}
