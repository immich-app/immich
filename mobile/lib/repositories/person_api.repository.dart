import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';

final personApiRepositoryProvider = Provider(
  (ref) => PersonApiRepository(ref.watch(apiServiceProvider).peopleApi),
);

class PersonApiRepository extends ApiRepository {
  final PeopleApi _api;

  PersonApiRepository(this._api);

  Future<List<PersonDto>> getAll() async {
    final dto = await checkNull(_api.getAllPeople());
    return dto.people.map(_toPerson).toList();
  }

  Future<PersonDto> update(String id, {String? name}) async {
    final dto = await checkNull(
      _api.updatePerson(id, PersonUpdateDto(name: name)),
    );
    return _toPerson(dto);
  }

  static PersonDto _toPerson(PersonResponseDto dto) => PersonDto(
        birthDate: dto.birthDate,
        id: dto.id,
        isHidden: dto.isHidden,
        name: dto.name,
        thumbnailPath: dto.thumbnailPath,
      );
}
