import 'dart:async';
import 'dart:isolate';

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

// !! Should be used only from the root isolate
class IsolateHelper {
  // Cache the ApiClient to reconstruct it later after inside the isolate
  late final _ImApiClientData? _clientData;

  static RootIsolateToken get _rootToken => RootIsolateToken.instance!;

  IsolateHelper();

  void preIsolateHandling() {
    final apiClient = di<ImmichApiClient>();
    _clientData = _ImApiClientData(
      endpoint: apiClient.basePath,
      headersMap: apiClient.defaultHeaderMap,
    );
  }

  void postIsolateHandling() {
    assert(_clientData != null);
    // Reconstruct client from cached data
    final client = ImmichApiClient(endpoint: _clientData!.endpoint);
    for (final entry in _clientData.headersMap.entries) {
      client.addDefaultHeader(entry.key, entry.value);
    }

    // Register all services in the isolates memory
    ServiceLocator.configureServicesForIsolate(
      database: DriftDatabaseRepository(),
      apiClient: client,
    );

    // Init log manager to continue listening to log events
    LogManager.I.init();
  }

  static Future<T> run<T>(FutureOr<T> Function() computation) async {
    final helper = IsolateHelper()..preIsolateHandling();
    final token = _rootToken;
    return await Isolate.run(() async {
      BackgroundIsolateBinaryMessenger.ensureInitialized(token);
      helper.postIsolateHandling();
      return await computation();
    });
  }
}
