import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
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
  WebsocketNotifier(this.ref) : super(WebscoketState(socket: null, isConnected: false));

  final Ref ref;

  connect() {
    var authenticationState = ref.watch(authenticationProvider);

    if (authenticationState.isAuthenticated) {
      var accessToken = Hive.box(userInfoBox).get(accessTokenKey);

      try {
        // Configure socket transports must be sepecified
        Socket socket = io(
          'http://192.168.1.216:2283/${authenticationState.userId}',
          OptionBuilder()
              .setTransports(['websocket'])
              .enableReconnection()
              .enableAutoConnect()
              .setExtraHeaders({"Authorization": "Bearer $accessToken"})
              .build(),
        );

        socket.onConnect((_) {
          state = WebscoketState(isConnected: true, socket: socket);
        });

        socket.onDisconnect((_) {
          state = WebscoketState(isConnected: false, socket: null);
        });

        socket.onError((data) => print("error connect to web socket $data"));
        socket.on('on_connected', (data) => print("on connect msg from server $data"));
        socket.on(
          'on_upload_success',
          (data) => print("on new asset $data"),
        );
      } catch (e) {
        print(e.toString());
      }
    }
  }
}

final websocketProvider = StateNotifierProvider<WebsocketNotifier, WebscoketState>((ref) {
  return WebsocketNotifier(ref);
});
