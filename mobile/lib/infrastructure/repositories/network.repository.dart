import 'dart:io';

import 'package:cronet_http/cronet_http.dart';
import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class NetworkRepository {
  static late Directory _cachePath;
  static final _clients = <String, http.Client>{};

  static Future<void> init() async {
    _cachePath = await getTemporaryDirectory();
  }

  static void reset() {
    Future.microtask(init);
    for (final client in _clients.values) {
      client.close();
    }
    _clients.clear();
  }

  const NetworkRepository();

  http.Client getHttpClient({
    required String directoryName,
    required int diskCapacity,
    required int memoryCapacity,
    required int maxConnections,
    required CacheMode cacheMode,
  }) {
    final cachedClient = _clients[directoryName];
    if (cachedClient != null) {
      return cachedClient;
    }

    final directory = Directory('${_cachePath.path}/$directoryName');
    directory.createSync(recursive: true);
    if (Platform.isAndroid) {
      final engine = CronetEngine.build(cacheMode: cacheMode, cacheMaxSize: diskCapacity, storagePath: directory.path);
      return _clients[directoryName] = CronetClient.fromCronetEngine(engine, closeEngine: true);
    }

    final config = URLSessionConfiguration.defaultSessionConfiguration()
      ..httpMaximumConnectionsPerHost = maxConnections
      ..cache = URLCache.withCapacity(
        diskCapacity: diskCapacity,
        memoryCapacity: memoryCapacity,
        directory: directory.uri,
      );
    return _clients[directoryName] = CupertinoClient.fromSessionConfiguration(config);
  }
}
