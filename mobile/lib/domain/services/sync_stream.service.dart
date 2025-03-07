// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:immich_mobile/domain/interfaces/sync-stream.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final Logger _logger = Logger('SyncStreamService');

  final ISyncApiRepository _syncApiRepository;
  final ISyncStreamRepository _syncStreamRepository;
  StreamSubscription? _userSyncSubscription;

  SyncStreamService({
    required ISyncApiRepository syncApiRepository,
    required ISyncStreamRepository syncStreamRepository,
  })  : _syncApiRepository = syncApiRepository,
        _syncStreamRepository = syncStreamRepository;

  void syncUsers() {
    _userSyncSubscription =
        _syncApiRepository.watchUserSyncEvent().listen((events) async {
      for (final event in events) {
        bool status = false;
        if (event.data is SyncUserV1) {
          _logger.fine("UserSyncUpdate: ${event.data}");
          status = await _syncStreamRepository.updateUsersV1(event.data);
        }

        if (event.data is SyncUserDeleteV1) {
          _logger.fine("SyncUserDelete: ${event.data}");
          status = await _syncStreamRepository.deleteUsersV1(event.data);
        }

        if (status) {
          await _syncApiRepository.ack(event.ack);
        }
      }
    });
  }

  Future<void> dispose() async {
    await _userSyncSubscription?.cancel();
  }
}
