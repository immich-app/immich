import 'package:openapi/api.dart';
import 'package:immich_mobile/infrastructure/repositories/api.repository.dart';

class DuplicatesApiRepository extends ApiRepository {
  final DuplicatesApi _duplicatesApi;

  DuplicatesApiRepository(this._duplicatesApi);

  Future<List<DuplicateResponseDto>> getAssetDuplicates() {
    return checkNull(_duplicatesApi.getAssetDuplicates());
  }

  Future<void> resolveDuplicates(DuplicateResolveDto duplicateResolveDto) {
    return _duplicatesApi.resolveDuplicates(duplicateResolveDto);
  }

  Future<void> dismissDuplicateGroup(String duplicateId) {
    return _duplicatesApi.deleteDuplicate(duplicateId);
  }

  Future<void> deleteDuplicateAssets(List<String> assetIds) {
    return _duplicatesApi.deleteDuplicates(BulkIdsDto(ids: assetIds));
  }
}
