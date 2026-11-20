import 'dart:async';
import 'dart:convert';
import 'dart:io' as io;
import 'dart:typed_data';

import 'package:web_socket/web_socket.dart';

/// A [WebSocket] backed by `dart:io`'s own TLS stack.
///
/// The API client was moved to Cronet so every connection negotiates a
/// post-quantum key exchange (X25519MLKEM768). Neither of the other transports
/// can do that for a WebSocket:
///
/// * Cronet has no WebSocket surface in `package:cronet_http`, and its JNI
///   bindings stop at `UrlRequest`.
/// * OkHttp performs the handshake through the platform Conscrypt provider,
///   whose group list is only x25519 / secp256r1 / secp384r1 -- no ML-KEM.
///
/// `dart:io` ships its own BoringSSL build, which does offer X25519MLKEM768,
/// so the socket keeps the same security level as the REST traffic.
///
/// This mirrors the `dart:io` connector that ships with `package:web_socket`,
/// with the addition of [headers], which that connector does not accept.
class IoWebSocket implements WebSocket {
  IoWebSocket._(this._socket) {
    _socket.listen(
      (event) {
        if (_events.isClosed) {
          return;
        }
        switch (event) {
          case final String text:
            _events.add(TextDataReceived(text));
          case final List<int> bytes:
            _events.add(BinaryDataReceived(Uint8List.fromList(bytes)));
        }
      },
      onError: (Object error, StackTrace stackTrace) {
        if (_events.isClosed) {
          return;
        }
        final exception = switch (error) {
          io.WebSocketException(message: final message) => WebSocketException(message),
          _ => WebSocketException(error.toString()),
        };
        _events.addError(exception, stackTrace);
      },
      onDone: () {
        if (_events.isClosed) {
          return;
        }
        // Deliver the close code first, then end the stream. `close()` returns a
        // future nobody can await from a callback, hence the explicit unawaited.
        _events.add(CloseReceived(_socket.closeCode, _socket.closeReason ?? ''));
        unawaited(_events.close());
      },
    );
  }

  /// Opens a socket, attaching the headers the native client would have added.
  static Future<WebSocket> connect(
    Uri uri, {
    Map<String, String>? headers,
    Iterable<String>? protocols,
  }) async {
    if (!uri.isScheme('ws') && !uri.isScheme('wss')) {
      throw ArgumentError.value(uri, 'uri', 'only ws: and wss: schemes are supported');
    }
    final io.WebSocket socket;
    try {
      socket = await io.WebSocket.connect(uri.toString(), headers: headers, protocols: protocols?.toList());
    } on io.WebSocketException catch (e) {
      throw WebSocketException(e.message);
    }
    if (socket.protocol != null && !(protocols ?? const []).contains(socket.protocol)) {
      // dart:io does not validate the subprotocol chosen by the peer.
      // See https://github.com/dart-lang/sdk/issues/55106
      await socket.close(1002);
      throw WebSocketException('unexpected protocol selected by peer: ${socket.protocol}');
    }
    return IoWebSocket._(socket);
  }

  final io.WebSocket _socket;
  final StreamController<WebSocketEvent> _events = StreamController<WebSocketEvent>();

  @override
  Stream<WebSocketEvent> get events => _events.stream;

  @override
  String get protocol => _socket.protocol ?? '';

  @override
  void sendText(String s) {
    if (_events.isClosed) {
      throw WebSocketConnectionClosed();
    }
    _socket.add(s);
  }

  @override
  void sendBytes(Uint8List b) {
    if (_events.isClosed) {
      throw WebSocketConnectionClosed();
    }
    _socket.add(b);
  }

  @override
  Future<void> close([int? code, String? reason]) async {
    if (_events.isClosed) {
      throw WebSocketConnectionClosed();
    }
    if (code != null && code != 1000 && !(code >= 3000 && code <= 4999)) {
      throw ArgumentError('Invalid argument: $code, close code must be 1000 or in the range 3000-4999');
    }
    if (reason != null && utf8.encode(reason).length > 123) {
      throw ArgumentError.value(reason, 'reason', 'reason must be <= 123 bytes long when encoded as UTF-8');
    }
    unawaited(_events.close());
    try {
      await _socket.close(code, reason);
    } on io.WebSocketException catch (e) {
      throw WebSocketException(e.message);
    }
  }
}
