// ignore_for_file: avoid-passing-async-when-sync-expected

import 'dart:async';

import 'package:collection/collection.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:worker_manager/worker_manager.dart';

const _kSyncTypeOrder = [
  SyncEntityType.userDeleteV1,
  SyncEntityType.userV1,
  SyncEntityType.partnerDeleteV1,
  SyncEntityType.partnerV1,
  SyncEntityType.assetDeleteV1,
  SyncEntityType.assetV1,
  SyncEntityType.assetExifV1,
  SyncEntityType.partnerAssetDeleteV1,
  SyncEntityType.partnerAssetV1,
  SyncEntityType.partnerAssetExifV1,
];

class SyncStreamService {
  final Logger _logger = Logger('SyncStreamService');

  final ISyncApiRepository _syncApiRepository;
  final ISyncStreamRepository _syncStreamRepository;
  final bool Function()? _cancelChecker;

  SyncStreamService({
    required ISyncApiRepository syncApiRepository,
    required ISyncStreamRepository syncStreamRepository,
    bool Function()? cancelChecker,
  })  : _syncApiRepository = syncApiRepository,
        _syncStreamRepository = syncStreamRepository,
        _cancelChecker = cancelChecker;

  Future<bool> _handleSyncData(
    SyncEntityType type,
    // ignore: avoid-dynamic
    Iterable<dynamic> data,
  ) async {
    if (data.isEmpty) {
      _logger.warning("Received empty sync data for $type");
      return false;
    }

    _logger.fine("Processing sync data for $type of length ${data.length}");

    try {
      if (type == SyncEntityType.partnerV1) {
        return await _syncStreamRepository.updatePartnerV1(data.cast());
      }

      if (type == SyncEntityType.partnerDeleteV1) {
        return await _syncStreamRepository.deletePartnerV1(data.cast());
      }

      if (type == SyncEntityType.userV1) {
        return await _syncStreamRepository.updateUsersV1(data.cast());
      }

      if (type == SyncEntityType.userDeleteV1) {
        return await _syncStreamRepository.deleteUsersV1(data.cast());
      }
    } catch (error, stack) {
      _logger.severe("Error processing sync data for $type", error, stack);
      return false;
    }

    _logger.warning("Unknown sync data type: $type");
    return false;
  }

  Future<void> _syncEvent(List<SyncRequestType> types) {
    _logger.info("Syncing Events: $types");
    final streamCompleter = Completer();
    bool shouldComplete = false;
    // the onDone callback might fire before the events are processed
    // the following flag ensures that the onDone callback is not called
    // before the events are processed and also that events are processed sequentially
    Completer? mutex;
    StreamSubscription? subscription;
    try {
      subscription = _syncApiRepository.getSyncEvents(types).listen(
        (events) async {
          if (events.isEmpty) {
            _logger.warning("Received empty sync events");
            return;
          }

          // If previous events are still being processed, wait for them to finish
          if (mutex != null) {
            await mutex!.future;
          }

          if (_cancelChecker?.call() ?? false) {
            _logger.info("Sync cancelled, stopping stream");
            subscription?.cancel();
            if (!streamCompleter.isCompleted) {
              streamCompleter.completeError(
                CanceledError(),
                StackTrace.current,
              );
            }
            return;
          }

          // Take control of the mutex and process the events
          mutex = Completer();

          try {
            final eventsMap = events.groupListsBy((event) => event.type);
            final Map<SyncEntityType, String> acks = {};

            for (final type in _kSyncTypeOrder) {
              final data = eventsMap[type];
              if (data == null) {
                continue;
              }

              if (_cancelChecker?.call() ?? false) {
                _logger.info("Sync cancelled, stopping stream");
                mutex?.complete();
                mutex = null;
                if (!streamCompleter.isCompleted) {
                  streamCompleter.completeError(
                    CanceledError(),
                    StackTrace.current,
                  );
                }

                return;
              }

              if (data.isEmpty) {
                _logger.warning("Received empty sync events for $type");
                continue;
              }

              if (await _handleSyncData(type, data.map((e) => e.data))) {
                // ignore: avoid-unsafe-collection-methods
                acks[type] = data.last.ack;
              } else {
                _logger.warning("Failed to handle sync events for $type");
              }
            }

            if (acks.isNotEmpty) {
              await _syncApiRepository.ack(acks.values.toList());
            }
            _logger.info("$types events processed");
          } catch (error, stack) {
            _logger.warning("Error handling sync events", error, stack);
          } finally {
            mutex?.complete();
            mutex = null;
          }

          if (shouldComplete) {
            _logger.info("Sync done, completing stream");
            if (!streamCompleter.isCompleted) streamCompleter.complete();
          }
        },
        onError: (error, stack) {
          _logger.warning("Error in sync stream for $types", error, stack);
          // Do not proceed if the stream errors
          if (!streamCompleter.isCompleted) {
            // ignore: avoid-missing-completer-stack-trace
            streamCompleter.completeError(error, stack);
          }
        },
        onDone: () {
          _logger.info("$types stream done");
          if (mutex == null && !streamCompleter.isCompleted) {
            streamCompleter.complete();
          } else {
            // Marks the stream as done but does not complete the completer
            // until the events are processed
            shouldComplete = true;
          }
        },
      );
    } catch (error, stack) {
      _logger.severe("Error starting sync stream", error, stack);
      if (!streamCompleter.isCompleted) {
        streamCompleter.completeError(error, stack);
      }
    }
    return streamCompleter.future.whenComplete(() {
      _logger.info("Sync stream completed");
      return subscription?.cancel();
    });
  }

  Future<void> syncUsers() =>
      _syncEvent([SyncRequestType.usersV1, SyncRequestType.partnersV1]);
}
