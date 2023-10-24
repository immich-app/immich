import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/services/sync.service.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:socket_io_client/socket_io_client.dart';

enum PendingAction {
  assetDelete,
}

class PendingChange {
  final PendingAction action;
  final dynamic value;

  const PendingChange(this.action, this.value);
}

class WebsocketState {
  final Socket? socket;
  final bool isConnected;
  final List<PendingChange> pendingChanges;

  WebsocketState({
    this.socket,
    required this.isConnected,
    required this.pendingChanges,
  });

  WebsocketState copyWith({
    Socket? socket,
    bool? isConnected,
    List<PendingChange>? pendingChanges,
  }) {
    return WebsocketState(
      socket: socket ?? this.socket,
      isConnected: isConnected ?? this.isConnected,
      pendingChanges: pendingChanges ?? this.pendingChanges,
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
      : super(
          WebsocketState(socket: null, isConnected: false, pendingChanges: []),
        ) {
    debounce = Debounce(
      const Duration(milliseconds: 500),
    );
  }

  final log = Logger('WebsocketNotifier');
  final Ref ref;
  late final Debounce debounce;

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
          state = WebsocketState(
            isConnected: true,
            socket: socket,
            pendingChanges: state.pendingChanges,
          );
        });

        socket.onDisconnect((_) {
          debugPrint("Disconnect to Websocket Connection");
          state = WebsocketState(
            isConnected: false,
            socket: null,
            pendingChanges: state.pendingChanges,
          );
        });

        socket.on('error', (errorMessage) {
          log.severe("Websocket Error - $errorMessage");
          state = WebsocketState(
            isConnected: false,
            socket: null,
            pendingChanges: state.pendingChanges,
          );
        });

        socket.on('on_upload_success', _handleOnUploadSuccess);
        socket.on('on_config_update', _handleOnConfigUpdate);
        socket.on('on_asset_delete', _handleOnAssetDelete);
        socket.on('on_asset_trash', _handleServerUpdates);
        socket.on('on_asset_restore', _handleServerUpdates);
        socket.on('on_asset_update', _handleServerUpdates);
      } catch (e) {
        debugPrint("[WEBSOCKET] Catch Websocket Error - ${e.toString()}");
      }
    }
  }

  disconnect() {
    debugPrint("Attempting to disconnect from websocket");

    var socket = state.socket?.disconnect();

    if (socket?.disconnected == true) {
      state = WebsocketState(
        isConnected: false,
        socket: null,
        pendingChanges: state.pendingChanges,
      );
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

  addPendingChange(PendingAction action, dynamic value) {
    state = state.copyWith(
      pendingChanges: [...state.pendingChanges, PendingChange(action, value)],
    );
  }

  handlePendingChanges() {
    final deleteChanges = state.pendingChanges
        .where((c) => c.action == PendingAction.assetDelete)
        .toList();
    if (deleteChanges.isNotEmpty) {
      List<String> remoteIds =
          deleteChanges.map((a) => a.value.toString()).toList();
      ref.read(syncServiceProvider).handleRemoteAssetRemoval(remoteIds);
      state = state.copyWith(
        pendingChanges: state.pendingChanges
            .where((c) => c.action != PendingAction.assetDelete)
            .toList(),
      );
    }
  }

  _handleOnUploadSuccess(dynamic data) {
    final dto = AssetResponseDto.fromJson(data);
    if (dto != null) {
      final newAsset = Asset.remote(dto);
      ref.watch(assetProvider.notifier).onNewAssetUploaded(newAsset);
    }
  }

  _handleOnConfigUpdate(dynamic _) {
    ref.read(serverInfoProvider.notifier).getServerFeatures();
    ref.read(serverInfoProvider.notifier).getServerConfig();
  }

  // Refresh updated assets
  _handleServerUpdates(dynamic _) {
    ref.read(assetProvider.notifier).getAllAsset();
  }

  _handleOnAssetDelete(dynamic data) {
    addPendingChange(PendingAction.assetDelete, data);
    debounce(handlePendingChanges);
  }
}

final websocketProvider =
    StateNotifierProvider<WebsocketNotifier, WebsocketState>((ref) {
  return WebsocketNotifier(ref);
});
