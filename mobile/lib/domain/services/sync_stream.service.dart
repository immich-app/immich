import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final ISyncApiRepository _syncApiRepository;

  SyncStreamService(this._syncApiRepository);

  StreamSubscription? _userSyncSubscription;

  void syncUsers() {
    _userSyncSubscription =
        _syncApiRepository.watchUserSyncEvent().listen((events) async {
      for (final event in events) {
        if (event.data is SyncUserV1) {
          final data = event.data as SyncUserV1;
          debugPrint("User Update: $data");

          // final user = await _userRepository.get(data.id);

          // if (user == null) {
          //   continue;
          // }

          // user.name = data.name;
          // user.email = data.email;
          // user.updatedAt = DateTime.now();

          // await _userRepository.update(user);
          // await _syncApiRepository.ack(event.ack);
        }

        if (event.data is SyncUserDeleteV1) {
          final data = event.data as SyncUserDeleteV1;

          debugPrint("User delete: $data");
          // await _syncApiRepository.ack(event.ack);
        }
      }
    });
  }

  Future<void> dispose() async {
    await _userSyncSubscription?.cancel();
  }
}
