import 'dart:async';
import 'dart:ui';

import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
// ignore: library_prefixes
import 'package:immich_mobile/entities/store.entity.dart' as dbStore;
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:immich_mobile/wm_executor.dart';
import 'package:logging/logging.dart';
import 'package:worker_manager/worker_manager.dart' show Cancelable;

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

  return workerManagerPatch.executeGentle((onCancel) async {
    BackgroundIsolateBinaryMessenger.ensureInitialized(token);
    DartPluginRegistrant.ensureInitialized();

    final log = Logger("IsolateLogger");
    final (dataController, apiService) = await Bootstrap.initDomain(
      shouldBufferLogs: false,
      disableStoreWatching: true,
    );
    final ref = ProviderContainer(
      overrides: Store.overrideWith(dataController: dataController, apiService: apiService),
    );

    try {
      return await computation(ref);
    } catch (error, stack) {
      log.severe("Error in runInIsolateGentle${debugLabel == null ? '' : ' for $debugLabel'}", error, stack);
      return null;
    } finally {
      ref.dispose();
      await dbStore.Store.dispose();
      await LogService.I.dispose();
      await dataController.close();
    }
  });
}
