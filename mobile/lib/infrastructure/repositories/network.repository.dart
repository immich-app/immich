import 'dart:io';

import 'package:cronet_http/cronet_http.dart';
import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

class NetworkRepository {
  static late Directory _cachePath;

  static Future<void> init() async {
    _cachePath = await getTemporaryDirectory();
  }

  const NetworkRepository();

  http.Client getHttpClient({
    required String directoryName,
    required int diskCapacity,
    required int memoryCapacity,
    required int maxConnections,
    required CacheMode cacheMode,
  }) {
    final directory = Directory('${_cachePath.path}/$directoryName');
    directory.createSync(recursive: true);
    if (Platform.isAndroid) {
      final engine = CronetEngine.build(cacheMode: cacheMode, cacheMaxSize: diskCapacity, storagePath: directory.path);
      return CronetClient.fromCronetEngine(engine, closeEngine: true);
    }

    final config = URLSessionConfiguration.defaultSessionConfiguration()
      ..httpMaximumConnectionsPerHost = maxConnections
      ..cache = URLCache.withCapacity(
        diskCapacity: diskCapacity,
        memoryCapacity: memoryCapacity,
        directory: directory.uri,
      );
    return CupertinoClient.fromSessionConfiguration(config);
  }
}
