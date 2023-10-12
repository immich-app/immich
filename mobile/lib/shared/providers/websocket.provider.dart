import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:socket_io_client/socket_io_client.dart';

class WebsocketState {
  final Socket? socket;
  final bool isConnected;

  WebsocketState({
    this.socket,
    required this.isConnected,
  });

  WebsocketState copyWith({
    Socket? socket,
    bool? isConnected,
  }) {
    return WebsocketState(
      socket: socket ?? this.socket,
      isConnected: isConnected ?? this.isConnected,
    );
  }

  @override
  String toString() =>
      'WebsocketState(socket: $socket, isConnected: $isConnected)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is WebsocketState &&
        other.socket == socket &&
        other.isConnected == isConnected;
  }

  @override
  int get hashCode => socket.hashCode ^ isConnected.hashCode;
}

class WebsocketNotifier extends StateNotifier<WebsocketState> {
  WebsocketNotifier(this.ref)
      : super(WebsocketState(socket: null, isConnected: false));

  final log = Logger('WebsocketNotifier');
  final Ref ref;

  connect() {
    var authenticationState = ref.read(authenticationProvider);

    if (authenticationState.isAuthenticated) {
      final accessToken = Store.get(StoreKey.accessToken);
      try {
        final endpoint = Uri.parse(Store.get(StoreKey.serverEndpoint));

        debugPrint("Attempting to connect to websocket");
        // Configure socket transports must be specified
        Socket socket = io(
          endpoint.origin,
          OptionBuilder()
              .setPath("${endpoint.path}/socket.io")
              .setTransports(['websocket'])
              .enableReconnection()
              .enableForceNew()
              .enableForceNewConnection()
              .enableAutoConnect()
              .setExtraHeaders({"Authorization": "Bearer $accessToken"})
              .build(),
        );

        socket.onConnect((_) {
          debugPrint("Established Websocket Connection");
          state = WebsocketState(isConnected: true, socket: socket);
        });

        socket.onDisconnect((_) {
          debugPrint("Disconnect to Websocket Connection");
          state = WebsocketState(isConnected: false, socket: null);
        });

        socket.on('error', (errorMessage) {
          log.severe("Websocket Error - $errorMessage");
          state = WebsocketState(isConnected: false, socket: null);
        });

        socket.on('on_upload_success', _handleOnUploadSuccess);
        socket.on('on_config_update', _handleOnConfigUpdate);
      } catch (e) {
        debugPrint("[WEBSOCKET] Catch Websocket Error - ${e.toString()}");
      }
    }
  }

  disconnect() {
    debugPrint("Attempting to disconnect from websocket");

    var socket = state.socket?.disconnect();

    if (socket?.disconnected == true) {
      state = WebsocketState(isConnected: false, socket: null);
    }
  }

  stopListenToEvent(String eventName) {
    debugPrint("Stop listening to event $eventName");
    state.socket?.off(eventName);
  }

  listenUploadEvent() {
    debugPrint("Start listening to event on_upload_success");
    state.socket?.on('on_upload_success', _handleOnUploadSuccess);
  }

  _handleOnUploadSuccess(dynamic data) {
    final jsonString = jsonDecode(data.toString());
    final dto = AssetResponseDto.fromJson(jsonString);
    if (dto != null) {
      final newAsset = Asset.remote(dto);
      ref.watch(assetProvider.notifier).onNewAssetUploaded(newAsset);
    }
  }

  _handleOnConfigUpdate(dynamic data) {
    ref.read(serverInfoProvider.notifier).getServerFeatures();
    ref.read(serverInfoProvider.notifier).getServerConfig();
  }
}

final websocketProvider =
    StateNotifierProvider<WebsocketNotifier, WebsocketState>((ref) {
  return WebsocketNotifier(ref);
});
