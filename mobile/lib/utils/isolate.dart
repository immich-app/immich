import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/infrastructure/repositories/logger_db.repository.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/cancel.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/utils/http_ssl_options.dart';
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

  return workerManager.executeGentle((cancelledChecker) async {
    BackgroundIsolateBinaryMessenger.ensureInitialized(token);
    DartPluginRegistrant.ensureInitialized();

    final db = await Bootstrap.initIsar();
    final logDb = DriftLogger();
    await Bootstrap.initDomain(db, logDb, shouldBufferLogs: false);
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
      HttpSSLOptions.apply(applyNative: false);
      return await computation(ref);
    } on CanceledError {
      log.warning("Computation cancelled ${debugLabel == null ? '' : ' for $debugLabel'}");
    } catch (error, stack) {
      log.severe("Error in runInIsolateGentle ${debugLabel == null ? '' : ' for $debugLabel'}", error, stack);
    } finally {
      try {
        await LogService.I.flush();
        await logDb.close();
        await ref.read(driftProvider).close();

        // Close Isar safely
        try {
          final isar = ref.read(isarProvider);
          if (isar.isOpen) {
            await isar.close();
          }
        } catch (e) {
          debugPrint("Error closing Isar: $e");
        }

        ref.dispose();
      } catch (error) {
        debugPrint("Error closing resources in isolate: $error");
      } finally {
        ref.dispose();
        // Delay to ensure all resources are released
        await Future.delayed(const Duration(seconds: 2));
      }
    }
    return null;
  });
}
