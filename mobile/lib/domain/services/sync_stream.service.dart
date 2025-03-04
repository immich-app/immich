import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/sync/sync_user_delete.model.dart';
import 'package:immich_mobile/domain/models/sync/sync_user_update.model.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/repositories/user.repository.dart';

final syncStreamServiceProvider = Provider(
  (ref) => SyncStreamService(
    ref.watch(syncApiRepositoryProvider),
    ref.watch(userRepositoryProvider),
  ),
);

class SyncStreamService {
  final ISyncApiRepository _syncApiRepository;
  final IUserRepository _userRepository;

  SyncStreamService(this._syncApiRepository, this._userRepository);

  void syncUsers() {
    _syncApiRepository.watchUserSyncEvent().listen((events) async {
      for (final event in events) {
        if (event.data is SyncUserUpdateResponse) {
          final data = event.data as SyncUserUpdateResponse;
          final user = await _userRepository.get(data.id);

          if (user == null) {
            continue;
          }

          user.name = data.name;
          user.email = data.email;
          user.updatedAt = DateTime.now();

          await _userRepository.update(user);
          await _syncApiRepository.ack(event.ack);
        }

        if (event.data is SyncUserDeleteResponse) {
          final data = event.data as SyncUserDeleteResponse;

          debugPrint("User delete: $data");
        }
      }
    });
  }
}
