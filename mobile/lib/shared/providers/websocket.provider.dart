import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';
import 'package:immich_mobile/shared/models/immich_asset.model.dart';
import 'package:socket_io_client/socket_io_client.dart';

import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';

class WebscoketState {
  final Socket? socket;
  final bool isConnected;

  WebscoketState({
    this.socket,
    required this.isConnected,
  });

  WebscoketState copyWith({
    Socket? socket,
    bool? isConnected,
  }) {
    return WebscoketState(
      socket: socket ?? this.socket,
      isConnected: isConnected ?? this.isConnected,
    );
  }

  @override
  String toString() => 'WebscoketState(socket: $socket, isConnected: $isConnected)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is WebscoketState && other.socket == socket && other.isConnected == isConnected;
  }

  @override
  int get hashCode => socket.hashCode ^ isConnected.hashCode;
}

class WebsocketNotifier extends StateNotifier<WebscoketState> {
  WebsocketNotifier(this.ref) : super(WebscoketState(socket: null, isConnected: false)) {
    debugPrint("Init websocket instance");
  }

  final Ref ref;

  connect() {
    var authenticationState = ref.read(authenticationProvider);

    if (authenticationState.isAuthenticated) {
      var accessToken = Hive.box(userInfoBox).get(accessTokenKey);
      var endpoint = Hive.box(userInfoBox).get(serverEndpointKey);
      try {
        debugPrint("[WEBSOCKET] Attempting to connect to ws");
        // Configure socket transports must be sepecified
        Socket socket = io(
          endpoint,
          OptionBuilder()
              .setTransports(['websocket'])
              .enableReconnection()
              .enableForceNew()
              .enableForceNewConnection()
              .enableAutoConnect()
              .setExtraHeaders({"Authorization": "Bearer $accessToken"})
              .build(),
        );

        socket.onConnect((_) {
          debugPrint("[WEBSOCKET] Established Websocket Connection");
          state = WebscoketState(isConnected: true, socket: socket);
        });

        socket.onDisconnect((_) {
          debugPrint("[WEBSOCKET] Disconnect to Websocket Connection");
          state = WebscoketState(isConnected: false, socket: null);
        });

        socket.on('error', (errorMessage) {
          debugPrint("Webcoket Error - $errorMessage");
          state = WebscoketState(isConnected: false, socket: null);
        });

        socket.on('on_upload_success', (data) {
          var jsonString = jsonDecode(data.toString());
          ImmichAsset newAsset = ImmichAsset.fromMap(jsonString);
          ref.watch(assetProvider.notifier).onNewAssetUploaded(newAsset);
        });
      } catch (e) {
        debugPrint("[WEBSOCKET] Catch Websocket Error - ${e.toString()}");
      }
    }
  }

  disconnect() {
    debugPrint("[WEBSOCKET] Attempting to disconnect");
    var socket = state.socket?.disconnect();
    if (socket != null) {
      if (socket.disconnected) {
        state = WebscoketState(isConnected: false, socket: null);
      }
    }
  }

  stopListenToEvent(String eventName) {
    debugPrint("[Websocket] Stop listening to event $eventName");
    state.socket?.off(eventName);
  }

  listenUploadEvent() {
    debugPrint("[Websocket] Start listening to event on_upload_success");
    state.socket?.on('on_upload_success', (data) {
      var jsonString = jsonDecode(data.toString());
      ImmichAsset newAsset = ImmichAsset.fromMap(jsonString);
      ref.watch(assetProvider.notifier).onNewAssetUploaded(newAsset);
    });
  }
}

final websocketProvider = StateNotifierProvider<WebsocketNotifier, WebscoketState>((ref) {
  return WebsocketNotifier(ref);
});
