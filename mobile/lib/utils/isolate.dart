import 'dart:async';
import 'dart:ui';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/wm_executor.dart';
import 'package:logging/logging.dart';
import 'package:worker_manager/worker_manager.dart';

class InvalidIsolateUsageException implements Exception {
  const InvalidIsolateUsageException();

  @override
  String toString() => "IsolateHelper should only be used from the root isolate";
}

// !! Should be used only from the root isolate
Cancelable<T?> runInIsolateGentle<T>({
  required Future<T> Function(ProviderContainer ref) computation,
  String? debugLabel,
}) {
  final token = RootIsolateToken.instance;
  if (token == null) {
    throw const InvalidIsolateUsageException();
  }

  return workerManagerPatch.executeGentle((cancelledChecker) async {
    T? result;
    await runZonedGuarded(
      () async {
        BackgroundIsolateBinaryMessenger.ensureInitialized(token);
        DartPluginRegistrant.ensureInitialized();

        final (isar, drift, logDb) = await Bootstrap.initDB();
        await Bootstrap.initDomain(isar, drift, logDb, shouldBufferLogs: false, listenStoreUpdates: false);
        final ref = ProviderContainer(
          overrides: [
            // TODO: Remove once isar is removed
            dbProvider.overrideWithValue(isar),
            isarProvider.overrideWithValue(isar),
            cancellationProvider.overrideWithValue(cancelledChecker),
            driftProvider.overrideWith(driftOverride(drift)),
          ],
        );

        Logger log = Logger("IsolateLogger");

        try {
          result = await computation(ref);
        } on CanceledError {
          log.warning("Computation cancelled ${debugLabel == null ? '' : ' for $debugLabel'}");
        } catch (error, stack) {
          log.severe("Error in runInIsolateGentle ${debugLabel == null ? '' : ' for $debugLabel'}", error, stack);
        } finally {
          try {
            ref.dispose();

            await Store.dispose();
            await LogService.I.dispose();
            await logDb.close();
            await drift.close();

            // Close Isar safely
            try {
              if (isar.isOpen) {
                await isar.close();
              }
            } catch (e) {
              dPrint(() => "Error closing Isar: $e");
            }
          } catch (error, stack) {
            dPrint(() => "Error closing resources in isolate: $error, $stack");
          } finally {
            ref.dispose();
            // Delay to ensure all resources are released
            await Future.delayed(const Duration(seconds: 2));
          }
        }
      },
      (error, stack) {
        dPrint(() => "Error in isolate $debugLabel zone: $error, $stack");
      },
    );
    return result;
  });
}
