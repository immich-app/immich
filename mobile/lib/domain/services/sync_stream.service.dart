// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/models/sync/sync_event.model.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final Logger _logger = Logger('SyncStreamService');

  final ISyncApiRepository _syncApiRepository;
  final ISyncStreamRepository _syncStreamRepository;

  StreamSubscription? _userSyncSubscription;
  Completer<void> _userSyncCompleter = Completer<void>();

  StreamSubscription? _partnerSyncSubscription;
  Completer<void> _partnerSyncCompleter = Completer<void>();

  SyncStreamService({
    required ISyncApiRepository syncApiRepository,
    required ISyncStreamRepository syncStreamRepository,
  })  : _syncApiRepository = syncApiRepository,
        _syncStreamRepository = syncStreamRepository;

  // ignore: avoid-dynamic
  Future<bool> _handleSyncData(dynamic data) async {
    if (data is SyncPartnerV1) {
      _logger.fine("SyncPartnerV1: $data");
      return await _syncStreamRepository.updatePartnerV1(data);
    }

    if (data is SyncUserV1) {
      _logger.fine("SyncUserV1: $data");
      return await _syncStreamRepository.updateUsersV1(data);
    }

    if (data is SyncPartnerDeleteV1) {
      _logger.fine("SyncPartnerDeleteV1: $data");
      return await _syncStreamRepository.deletePartnerV1(data);
    }

    if (data is SyncUserDeleteV1) {
      _logger.fine("SyncUserDeleteV1: $data");
      return await _syncStreamRepository.deleteUsersV1(data);
    }

    return false;
  }

  Future<void> _handleSyncEvents(List<SyncEvent> events) async {
    Map<SyncEntityType, String> acks = {};
    for (final event in events) {
      if (await _handleSyncData(event.data)) {
        // Only retain the latest ack from each type
        acks[event.type] = event.ack;
      }
    }
    await _syncApiRepository.ack(acks.values.toList());
  }

  Future<void> syncUsers() async {
    _logger.info("Syncing User Changes");
    _userSyncSubscription =
        _syncApiRepository.getSyncEvents([SyncRequestType.usersV1]).listen(
      _handleSyncEvents,
      onDone: () {
        _userSyncCompleter.complete();
        _userSyncCompleter = Completer<void>();
      },
    );
    return await _userSyncCompleter.future;
  }

  Future<void> syncPartners() async {
    _logger.info("Syncing Partner Changes");
    _partnerSyncSubscription =
        _syncApiRepository.getSyncEvents([SyncRequestType.partnersV1]).listen(
      _handleSyncEvents,
      onDone: () {
        _partnerSyncCompleter.complete();
        _partnerSyncCompleter = Completer<void>();
      },
    );
    return await _partnerSyncCompleter.future;
  }

  Future<void> dispose() async {
    await _userSyncSubscription?.cancel();
    _userSyncCompleter.complete();
    await _partnerSyncSubscription?.cancel();
    _partnerSyncCompleter.complete();
  }
}
