import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/repositories/sync_api.repository.dart';

final syncStreamServiceProvider =
    Provider((ref) => SyncStreamService(ref.watch(syncApiRepositoryProvider)));

class SyncStreamService {
  final ISyncApiRepository _syncApiRepository;

  SyncStreamService(this._syncApiRepository);

  void syncUsers() {
    _syncApiRepository.watchUserSyncEvent().listen((event) {
      print(event);
    });
  }
}
