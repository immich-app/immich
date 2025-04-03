import 'dart:async';
import 'dart:isolate';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/bootstrap.dart';
import 'package:logging/logging.dart';

class InvalidIsolateUsageException implements Exception {
  const InvalidIsolateUsageException();

  @override
  String toString() =>
      "IsolateHelper should only be used from the root isolate";
}

// !! Should be used only from the root isolate
Future<T?> runInIsolate<T>(
  FutureOr<T> Function(ProviderContainer ref) computation, {
  String? debugLabel,
}) async {
  final token = RootIsolateToken.instance;
  if (token == null) {
    throw const InvalidIsolateUsageException();
  }

  return await Isolate.run(() async {
    BackgroundIsolateBinaryMessenger.ensureInitialized(token);
    DartPluginRegistrant.ensureInitialized();

    final db = await Bootstrap.initIsar();
    await Bootstrap.initDomain(db);
    final ref = ProviderContainer(
      overrides: [
        // TODO: Remove once isar is removed
        dbProvider.overrideWithValue(db),
        isarProvider.overrideWithValue(db),
      ],
    );

    Logger log = Logger("IsolateLogger");

    try {
      final result = await computation(ref);
      // Wait for isolate to end; i.e, logs to be flushed
      await Future.delayed(Durations.short2);
      return result;
    } catch (error, stack) {
      log.severe(
        "Error in runInIsolate${debugLabel == null ? '' : ' for $debugLabel'}",
        error,
        stack,
      );
    } finally {
      // Always close the new db connection on Isolate end
      ref.read(driftProvider).close();
      ref.read(dbProvider).close();
      ref.read(isarProvider).close();
    }
    return null;
  });
}
