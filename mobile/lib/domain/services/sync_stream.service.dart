// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncStreamService {
  final Logger _logger = Logger('SyncStreamService');

  final ISyncApiRepository _syncApiRepository;
  final ISyncStreamRepository _syncStreamRepository;

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

  Future<void> _syncEvent(List<SyncRequestType> types) async {
    _logger.info("Syncing Events: $types");
    final streamCompleter = Completer();
    bool shouldSkipOnDone = false;
    final subscription = _syncApiRepository.getSyncEvents(types).listen(
      (events) async {
        try {
          Map<SyncEntityType, String> acks = {};
          for (final event in events) {
            // the onDone callback might fire before the events are processed
            // the following flag ensures that the onDone callback is not called
            // before the events are processed
            shouldSkipOnDone = true;
            if (await _handleSyncData(event.data)) {
              // Only retain the latest ack from each type
              acks[event.type] = event.ack;
            }
          }
          await _syncApiRepository.ack(acks.values.toList());
        } catch (error, stack) {
          _logger.warning("Error handling sync events", error, stack);
        }
        streamCompleter.completeOnce();
      },
      onError: (_) => streamCompleter.completeOnce(),
      // onDone is required to be called in cases where the stream is empty
      onDone: () => shouldSkipOnDone ? null : streamCompleter.completeOnce,
    );
    streamCompleter.future.whenComplete(subscription.cancel);
    return await streamCompleter.future;
  }

  Future<void> syncUsers() => _syncEvent([SyncRequestType.usersV1]);
  Future<void> syncPartners() => _syncEvent([SyncRequestType.partnersV1]);
}

extension on Completer {
  void completeOnce() {
    if (!isCompleted) {
      complete();
    }
  }
}
