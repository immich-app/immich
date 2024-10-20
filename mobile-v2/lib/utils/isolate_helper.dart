import 'dart:async';
import 'dart:isolate';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/repositories/database.repository.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';
import 'package:immich_mobile/utils/log_manager.dart';

@immutable
class _ImApiClientData {
  final String endpoint;
  final Map<String, String> headersMap;

  const _ImApiClientData({required this.endpoint, required this.headersMap});
}

class InvalidIsolateUsageException implements Exception {
  const InvalidIsolateUsageException();

  @override
  String toString() =>
      "IsolateHelper should only be used from the root isolate";
}

// !! Should be used only from the root isolate
class IsolateHelper {
  // Cache the ApiClient to reconstruct it later after inside the isolate
  late final _ImApiClientData? _clientData;

  IsolateHelper();

  void preIsolateHandling() {
    final apiClient = di<ImApiClient>();
    _clientData = _ImApiClientData(
      endpoint: apiClient.basePath,
      headersMap: apiClient.defaultHeaderMap,
    );
  }

  void postIsolateHandling() {
    assert(_clientData != null);
    // Reconstruct client from cached data
    final client = ImApiClient(endpoint: _clientData!.endpoint);
    for (final entry in _clientData.headersMap.entries) {
      client.addDefaultHeader(entry.key, entry.value);
    }

    // Register all services in the isolates memory
    ServiceLocator.configureServicesForIsolate(
      database: DriftDatabaseRepository(),
      apiClient: client,
    );

    // Init log manager to continue listening to log events
    LogManager.I.init(shouldBuffer: false);
  }

  static Future<T> run<T>(FutureOr<T> Function() computation) async {
    final token = RootIsolateToken.instance;
    if (token == null) {
      throw const InvalidIsolateUsageException();
    }

    final helper = IsolateHelper()..preIsolateHandling();
    return await Isolate.run(() async {
      BackgroundIsolateBinaryMessenger.ensureInitialized(token);
      DartPluginRegistrant.ensureInitialized();
      // Delay to ensure the isolate is ready
      await Future.delayed(Durations.short2);
      helper.postIsolateHandling();
      try {
        final result = await computation();
        // Delay to ensure the isolate is not killed prematurely
        await Future.delayed(Durations.short2);
        return result;
      } finally {
        // Always close the new database connection on Isolate end
        await di<DriftDatabaseRepository>().close();
      }
    });
  }
}
