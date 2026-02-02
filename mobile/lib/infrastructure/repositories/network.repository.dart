import 'dart:ffi';
import 'dart:io';

import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:logging/logging.dart';
import 'package:ok_http/ok_http.dart';
import 'package:web_socket/web_socket.dart';

class NetworkRepository {
  static final _log = Logger('NetworkRepository');
  static http.Client? _client;
  static late int _clientPointer;

  static Future<void> init() async {
    _clientPointer = await networkApi.getClientPointer();
    _client?.close();
    if (Platform.isIOS) {
      _client = _createIOSClient(_clientPointer);
    } else {
      _client = _createAndroidClient(_clientPointer);
    }
  }

  // ignore: avoid-unused-parameters
  static Future<WebSocket> createWebSocket(Uri uri, {Map<String, String>? headers, Iterable<String>? protocols}) {
    if (Platform.isIOS) {
      return _createIOSWebSocket(uri, protocols: protocols);
    } else {
      return _createAndroidWebSocket(uri, protocols: protocols);
    }
  }

  const NetworkRepository();

  /// Returns a shared HTTP client that uses native SSL configuration.
  ///
  /// On iOS: Uses SharedURLSessionManager's URLSession.
  /// On Android: Uses SharedHttpClientManager's OkHttpClient.
  ///
  /// Must call [init] before using this method.
  static http.Client get client => _client!;

  static http.Client _createIOSClient(int address) {
    final pointer = Pointer.fromAddress(address);
    final session = URLSession.fromRawPointer(pointer.cast());
    _log.info('Using shared native URLSession');
    return CupertinoClient.fromSharedSession(session);
  }

  static http.Client _createAndroidClient(int address) {
    final pointer = Pointer<Void>.fromAddress(address);
    _log.info('Using shared native OkHttpClient');
    return OkHttpClient.fromJniGlobalRef(pointer);
  }

  static Future<WebSocket> _createIOSWebSocket(Uri uri, {Iterable<String>? protocols}) async {
    final result = await networkApi.createWebSocketTask(uri.toString(), protocols?.toList());
    final pointer = Pointer.fromAddress(result.taskPointer);
    final task = URLSessionWebSocketTask.fromRawPointer(pointer.cast());
    return CupertinoWebSocket.fromConnectedTask(task, protocol: result.taskProtocol ?? '');
  }

  static Future<WebSocket> _createAndroidWebSocket(Uri uri, {Iterable<String>? protocols}) {
    final pointer = Pointer<Void>.fromAddress(_clientPointer);
    return OkHttpWebSocket.connectFromJniGlobalRef(pointer, uri, protocols: protocols);
  }
}
