import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/infrastructure/repositories/person.repository.dart';

class PersonService {
  final DriftPersonRepository _repository;

  const PersonService(this._repository);

  Future<List<Person>> getAll(String userId) {
    return _repository.getAll(userId);
  }
}
