import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:socket_io_client/socket_io_client.dart';

class WebsocketState {
  final Socket? socket;
  final bool isConnected;

  const WebsocketState({this.socket, required this.isConnected});

  WebsocketState copyWith({Socket? socket, bool? isConnected}) {
    return WebsocketState(socket: socket ?? this.socket, isConnected: isConnected ?? this.isConnected);
  }

  @override
  String toString() => 'WebsocketState(socket: $socket, isConnected: $isConnected)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }

    return other is WebsocketState && other.socket == socket && other.isConnected == isConnected;
  }

  @override
  int get hashCode => socket.hashCode ^ isConnected.hashCode;
}

class WebsocketNotifier extends StateNotifier<WebsocketState> {
  WebsocketNotifier(this._ref) : super(const WebsocketState(socket: null, isConnected: false));

  final _log = Logger('WebsocketNotifier');
  final Ref _ref;

  final Debouncer _batchDebouncer = Debouncer(
    interval: const Duration(seconds: 5),
    maxWaitTime: const Duration(seconds: 10),
  );
  final List<dynamic> _batchedAssetUploadReady = [];

  @override
  void dispose() {
    _batchDebouncer.dispose();
    super.dispose();
  }

  /// Connects websocket to server unless already connected
  void connect() {
    if (state.isConnected) {
      return;
    }
    final authenticationState = _ref.read(authProvider);

    if (authenticationState.isAuthenticated) {
      try {
        final endpoint = Uri.parse(Store.get(StoreKey.serverEndpoint));
        dPrint(() => "Attempting to connect to websocket");
        // Configure socket transports must be specified
        Socket socket = io(
          endpoint.origin,
          OptionBuilder()
              .setPath("${endpoint.path}/socket.io")
              .setTransports(['websocket'])
              .setWebSocketConnector(NetworkRepository.createWebSocket)
              .enableReconnection()
              .enableForceNew()
              .enableForceNewConnection()
              .enableAutoConnect()
              .build(),
        );

        socket.onConnect((_) {
          dPrint(() => "Established Websocket Connection");
          state = WebsocketState(isConnected: true, socket: socket);
        });

        socket.onDisconnect((_) {
          dPrint(() => "Disconnect to Websocket Connection");
          state = const WebsocketState(isConnected: false, socket: null);
        });

        socket.on('error', (errorMessage) {
          _log.severe("Websocket Error - $errorMessage");
          state = const WebsocketState(isConnected: false, socket: null);
        });

        socket.on('AssetUploadReadyV1', _handleSyncAssetUploadReadyV1);
        socket.on('AssetUploadReadyV2', _handleSyncAssetUploadReadyV2);
        socket.on('AssetEditReadyV1', _handleSyncAssetEditReadyV1);
        socket.on('AssetEditReadyV2', _handleSyncAssetEditReadyV2);
        socket.on('on_config_update', _handleOnConfigUpdate);
        socket.on('on_new_release', _handleReleaseUpdates);
      } catch (e) {
        dPrint(() => "[WEBSOCKET] Catch Websocket Error - ${e.toString()}");
      }
    }
  }

  void disconnect() {
    dPrint(() => "Attempting to disconnect from websocket");

    _batchedAssetUploadReady.clear();

    state.socket?.dispose();
    state = const WebsocketState(isConnected: false, socket: null);
  }

  Future<void> waitForEvent(String event, bool Function(dynamic)? predicate, Duration timeout) {
    final completer = Completer<void>();

    void handler(dynamic data) {
      if (predicate == null || predicate(data)) {
        completer.complete();
        state.socket?.off(event, handler);
      }
    }

    state.socket?.on(event, handler);

    return completer.future.timeout(
      timeout,
      onTimeout: () {
        state.socket?.off(event, handler);
        completer.completeError(TimeoutException("Timeout waiting for event: $event"));
      },
    );
  }

  void _handleOnConfigUpdate(dynamic _) {
    _ref.read(serverInfoProvider.notifier).getServerFeatures();
    _ref.read(serverInfoProvider.notifier).getServerConfig();
  }

  _handleReleaseUpdates(dynamic data) {
    // Json guard
    if (data is! Map) {
      return;
    }

    final json = data.cast<String, dynamic>();
    final serverVersionJson = json.containsKey('serverVersion') ? json['serverVersion'] : null;
    final releaseVersionJson = json.containsKey('releaseVersion') ? json['releaseVersion'] : null;
    if (serverVersionJson == null || releaseVersionJson == null) {
      return;
    }

    final serverVersionDto = ServerVersionResponseDto.fromJson(serverVersionJson);
    final releaseVersionDto = ServerVersionResponseDto.fromJson(releaseVersionJson);
    if (serverVersionDto == null || releaseVersionDto == null) {
      return;
    }

    final serverVersion = ServerVersion.fromDto(serverVersionDto);
    final releaseVersion = ServerVersion.fromDto(releaseVersionDto);
    _ref.read(serverInfoProvider.notifier).handleReleaseInfo(serverVersion, releaseVersion);
  }

  void _handleSyncAssetUploadReadyV1(dynamic data) {
    _batchedAssetUploadReady.add(data);
    _batchDebouncer.run(_processBatchedAssetUploadReadyV1);
  }

  void _handleSyncAssetUploadReadyV2(dynamic data) {
    _batchedAssetUploadReady.add(data);
    _batchDebouncer.run(_processBatchedAssetUploadReadyV2);
  }

  void _handleSyncAssetEditReadyV1(dynamic data) {
    unawaited(_ref.read(backgroundSyncProvider).syncWebsocketEditV1(data));
  }

  void _handleSyncAssetEditReadyV2(dynamic data) {
    unawaited(_ref.read(backgroundSyncProvider).syncWebsocketEditV2(data));
  }

  void _processBatchedAssetUploadReadyV1() {
    if (_batchedAssetUploadReady.isEmpty) {
      return;
    }

    final isSyncAlbumEnabled = Store.get(StoreKey.syncAlbums, false);
    try {
      unawaited(
        _ref.read(backgroundSyncProvider).syncWebsocketBatchV1(_batchedAssetUploadReady.toList()).then((_) {
          if (isSyncAlbumEnabled) {
            _ref.read(backgroundSyncProvider).syncLinkedAlbum();
          }
        }),
      );
    } catch (error) {
      _log.severe("Error processing batched AssetUploadReadyV1 events: $error");
    }

    _batchedAssetUploadReady.clear();
  }

  void _processBatchedAssetUploadReadyV2() {
    if (_batchedAssetUploadReady.isEmpty) {
      return;
    }

    final isSyncAlbumEnabled = Store.get(StoreKey.syncAlbums, false);
    try {
      unawaited(
        _ref.read(backgroundSyncProvider).syncWebsocketBatchV2(_batchedAssetUploadReady.toList()).then((_) {
          if (isSyncAlbumEnabled) {
            _ref.read(backgroundSyncProvider).syncLinkedAlbum();
          }
        }),
      );
    } catch (error) {
      _log.severe("Error processing batched AssetUploadReadyV2 events: $error");
    }

    _batchedAssetUploadReady.clear();
  }
}

final websocketProvider = StateNotifierProvider<WebsocketNotifier, WebsocketState>((ref) {
  return WebsocketNotifier(ref);
});
