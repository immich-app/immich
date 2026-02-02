import 'dart:ffi';
import 'dart:io';

import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:logging/logging.dart';
import 'package:ok_http/ok_http.dart';

class NetworkRepository {
  static final _log = Logger('NetworkRepository');
  static http.Client? _client;

  static Future<void> init() async {
    final pointer = await networkApi.getClientPointer();
    _client?.close();
    if (Platform.isIOS) {
      _client = _createIOSClient(pointer);
    } else {
      _client = _createAndroidClient(pointer);
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
}
