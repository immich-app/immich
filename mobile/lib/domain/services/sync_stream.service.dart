import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/interfaces/user.interface.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final ISyncApiRepository _syncApiRepository;
  final IUserRepository _userRepository;

  SyncStreamService(this._syncApiRepository, this._userRepository);

  void syncUsers() {
    _syncApiRepository.watchUserSyncEvent().listen((events) async {
      for (final event in events) {
        if (event.data is SyncUserV1) {
          final data = event.data as SyncUserV1;
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

        if (event.data is SyncUserDeleteV1) {
          final data = event.data as SyncUserDeleteV1;

          debugPrint("User delete: $data");
          await _syncApiRepository.ack(event.ack);
        }
      }
    });
  }
}
