import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/repositories/etag.repository.dart';

final etagServiceProvider =
    Provider((ref) => ETagService(ref.watch(etagRepositoryProvider)));

class ETagService {
  final ETagRepository _eTagRepository;

  ETagService(this._eTagRepository);

  Future<void> clearTable() {
    return _eTagRepository.clearTable();
  }
}
