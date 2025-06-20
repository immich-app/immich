import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.dart';
import 'package:immich_mobile/interfaces/person_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final personApiRepositoryProvider = Provider(
  (ref) => PersonApiRepository(ref.watch(apiServiceProvider).peopleApi),
);

class PersonApiRepository extends ApiRepository
    implements IPersonApiRepository {
  final PeopleApi _api;

  PersonApiRepository(this._api);

  @override
  Future<List<Person>> getAll({bool withHidden = false}) async {
    final dto = await checkNull(_api.getAllPeople(withHidden: withHidden));
    return dto.people.map(_toPerson).toList();
  }

  @override
  Future<Person> update(String id, {String? name, bool? isHidden}) async {
    final dto = await checkNull(
      _api.updatePerson(id, PersonUpdateDto(name: name, isHidden: isHidden)),
    );
    return _toPerson(dto);
  }

  static Person _toPerson(PersonResponseDto dto) => Person(
        birthDate: dto.birthDate,
        id: dto.id,
        isHidden: dto.isHidden,
        name: dto.name,
        thumbnailPath: dto.thumbnailPath,
      );
}
