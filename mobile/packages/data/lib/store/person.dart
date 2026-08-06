import 'package:immich_data/db/person.dart';
import 'package:immich_data/model/person.dart';
import 'package:immich_data/server/person.dart';
import 'package:meta/meta.dart';

// TODO(rewrite): This needs to be made reactive
class PersonService {
  final PersonDatabaseRepository _db;
  final PersonApiRepository _api;

  @internal
  const PersonService(this._db, this._api);

  /// Get a person by ID
  Future<Person?> get(String personId) {
    return _db.get(personId);
  }

  /// People associated with a given asset
  ///
  /// **NOTE:** This is Drift only
  Future<List<Person>> getAssetPeople(String assetId) {
    return _db.getAssetPeople(assetId);
  }

  /// All people known by Drift
  // TODO(rewrite): Combine with server fetch
  Future<List<Person>> getAllPeopleFromDb({int minFaces = 3}) {
    return _db.getAllPeople(minFaces: minFaces);
  }

  /// All people known by the server
  // TODO(rewrite): Combine with DB fetch
  Future<List<PersonDto>> getAllPeopleFromServer() {
    return _api.getAll();
  }

  /// Update a person's name
  Future<int> updateName(String personId, String name) async {
    await _api.update(personId, name: name);
    return _db.updateName(personId, name);
  }

  /// Update a person's birthday
  Future<int> updateBirthday(String personId, DateTime birthday) async {
    await _api.update(personId, birthday: birthday);
    return _db.updateBirthday(personId, birthday);
  }
}
