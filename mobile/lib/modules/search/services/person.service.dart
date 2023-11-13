import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/utils/logger_mixin.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'person.service.g.dart';

@riverpod
PersonService personService(PersonServiceRef ref) =>
    PersonService(ref.read(apiServiceProvider));

class PersonService with ErrorLoggerMixin {
  @override
  final Logger log = Logger("PersonService");
  final ApiService _apiService;

  PersonService(this._apiService);

  Future<List<PersonResponseDto>> getCuratedPeople() async {
    return await logOnErrorWithDefault(
      () async {
        final peopleResponseDto = await _apiService.personApi.getAllPeople();
        return peopleResponseDto?.people ?? [];
      },
      [],
      futureName: 'getCuratedPeople',
    );
  }

  Future<List<Asset>?> getPersonAssets(String id) async {
    return await logOnError(
      () async {
        final assets = await _apiService.personApi.getPersonAssets(id);
        return assets?.map((e) => Asset.remote(e)).toList();
      },
      futureName: 'getPersonAssets',
    );
  }

  Future<PersonResponseDto?> updateName(
    String id,
    String name,
  ) async {
    return await logOnError(
      () => _apiService.personApi.updatePerson(
        id,
        PersonUpdateDto(
          name: name,
        ),
      ),
      futureName: 'updateName',
    );
  }
}
