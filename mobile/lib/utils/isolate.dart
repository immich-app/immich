import 'dart:async';
import 'dart:ui';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:logging/logging.dart';
import 'package:worker_manager/worker_manager.dart';

class InvalidIsolateUsageException implements Exception {
  const InvalidIsolateUsageException();

  @override
  String toString() =>
      "IsolateHelper should only be used from the root isolate";
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

  return workerManager.executeGentle((cancelledChecker) async {
    BackgroundIsolateBinaryMessenger.ensureInitialized(token);
    DartPluginRegistrant.ensureInitialized();

    final db = await Bootstrap.initIsar();
    await Bootstrap.initDomain(db, shouldBufferLogs: false);
    final ref = ProviderContainer(
      overrides: [
        // TODO: Remove once isar is removed
        dbProvider.overrideWithValue(db),
        isarProvider.overrideWithValue(db),
        cancellationProvider.overrideWithValue(cancelledChecker),
      ],
    );

    Logger log = Logger("IsolateLogger");

    try {
      return await computation(ref);
    } on CanceledError {
      log.warning(
        "Computation cancelled ${debugLabel == null ? '' : ' for $debugLabel'}",
      );
    } catch (error, stack) {
      log.severe(
        "Error in runInIsolateGentle ${debugLabel == null ? '' : ' for $debugLabel'}",
        error,
        stack,
      );
    } finally {
      // Wait for the logs to flush
      await Future.delayed(const Duration(seconds: 2));
      // Always close the new db connection on Isolate end
      ref.read(driftProvider).close();
      ref.read(isarProvider).close();
    }
    return null;
  });
}
