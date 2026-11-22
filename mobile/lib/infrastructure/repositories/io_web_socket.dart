import 'dart:async';
import 'dart:convert';
import 'dart:io' as io;
import 'dart:typed_data';

import 'package:web_socket/web_socket.dart';

/// 基于 `dart:io` TLS 栈的 [WebSocket]。
///
/// Cronet 没有 WebSocket 接口，OkHttp 的 Conscrypt 也没有 ML-KEM 组；
/// `dart:io` 自带 BoringSSL，有 X25519MLKEM768。
///
/// 照 `package:web_socket` 的连接器写的，多了 [headers]。
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
        // 先送关闭码，回调里没法 await close()。
        _events.add(CloseReceived(_socket.closeCode, _socket.closeReason ?? ''));
        unawaited(_events.close());
      },
    );
  }

  /// 建连接，带上原生客户端本来会加的 header。
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
