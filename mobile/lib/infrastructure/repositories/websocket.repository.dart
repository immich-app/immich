import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:socket_io_client/socket_io_client.dart';

final websocketRepositoryProvider = Provider(
  (ref) => WebsocketRepository(),
);

class WebsocketRepository {
  Socket? _socket;
  Function(dynamic)? _onAssetUploadReady;

  WebsocketRepository();

  Future<void> connect() async {
    try {
      final endpoint = Uri.parse(Store.get(StoreKey.serverEndpoint));
      final headers = ApiService.getRequestHeaders();
      if (endpoint.userInfo.isNotEmpty) {
        headers["Authorization"] =
            "Basic ${base64.encode(utf8.encode(endpoint.userInfo))}";
      }

      debugPrint("[ISOLATE] Attempting to connect to websocket");

      _socket = io(
        endpoint.origin,
        OptionBuilder()
            .setPath("${endpoint.path}/socket.io")
            .setTransports(['websocket'])
            .enableReconnection()
            .enableForceNew()
            .enableForceNewConnection()
            .enableAutoConnect()
            .setExtraHeaders(headers)
            .build(),
      );

      _socket?.onConnect((_) {
        debugPrint("[ISOLATE] Established Websocket Connection");
      });

      _socket?.onDisconnect((_) {
        debugPrint("[ISOLATE] Disconnect to Websocket Connection");
      });

      _socket?.onError((error) {
        debugPrint("[ISOLATE] Websocket Error - $error");
      });

      _socket?.on(
        'AssetUploadReadyV1',
        (data) => _onAssetUploadReady?.call(data),
      );
    } catch (e) {
      debugPrint("[WEBSOCKET] Catch Websocket Error - ${e.toString()}");
    }
  }

  void assetUploadReadyCallback(Function(dynamic) handler) {
    _onAssetUploadReady = handler;
  }

  Future<void> disconnect() async {
    var socket = _socket?.disconnect();

    if (socket?.disconnected == true) {
      debugPrint("Websocket disconnected successfully");
    }
  }
}
