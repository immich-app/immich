import 'dart:io';

import 'package:cronet_http/cronet_http.dart';
import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/utils/user_agent.dart';
import 'package:path_provider/path_provider.dart';

class NetworkRepository {
  static late Directory _cachePath;
  static late String _userAgent;
  static final _clients = <String, http.Client>{};

  static Future<void> init() {
    return (
      getTemporaryDirectory().then((cachePath) => _cachePath = cachePath),
      getUserAgentString().then((userAgent) => _userAgent = userAgent),
    ).wait;
  }

  static void reset() {
    Future.microtask(init);
    for (final client in _clients.values) {
      client.close();
    }
    _clients.clear();
  }

  const NetworkRepository();

  /// Note: when disk caching is enabled, only one client may use a given directory at a time.
  /// Different isolates or engines must use different directories.
  http.Client getHttpClient(
    String directoryName, {
    CacheMode cacheMode = CacheMode.memory,
    int diskCapacity = 0,
    int maxConnections = 6,
    int memoryCapacity = 10 << 20,
  }) {
    final cachedClient = _clients[directoryName];
    if (cachedClient != null) {
      return cachedClient;
    }

    final directory = Directory('${_cachePath.path}/$directoryName');
    directory.createSync(recursive: true);
    if (Platform.isAndroid) {
      final engine = CronetEngine.build(
        cacheMode: cacheMode,
        cacheMaxSize: diskCapacity,
        storagePath: directory.path,
        userAgent: _userAgent,
      );
      return _clients[directoryName] = CronetClient.fromCronetEngine(engine, closeEngine: true);
    }

    final config = URLSessionConfiguration.defaultSessionConfiguration()
      ..httpMaximumConnectionsPerHost = maxConnections
      ..cache = URLCache.withCapacity(
        diskCapacity: diskCapacity,
        memoryCapacity: memoryCapacity,
        directory: directory.uri,
      )
      ..httpAdditionalHeaders = {'User-Agent': _userAgent};
    return _clients[directoryName] = CupertinoClient.fromSessionConfiguration(config);
  }
}
