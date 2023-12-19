import 'dart:io';

import 'package:cronet_http/cronet_http.dart';
import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart';

Client getHttpClient() {
  final Client client;
  if (Platform.isAndroid) {
    final engine = CronetEngine.build(
      enableHttp2: true,
      enableBrotli: true,
      cacheMode: CacheMode.memory,
    );
    client = CronetClient.fromCronetEngine(engine);
  } else if (Platform.isIOS) {
    final config = URLSessionConfiguration.ephemeralSessionConfiguration()
      ..allowsCellularAccess = true
      ..allowsConstrainedNetworkAccess = true
      ..allowsExpensiveNetworkAccess = true;
    client = CupertinoClient.fromSessionConfiguration(config);
  } else {
    client = Client();
  }
  return client;
}
