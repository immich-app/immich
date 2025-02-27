import 'dart:io';

import 'package:flutter/services.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';

class HttpSSLOptions {
  static const MethodChannel _channel = MethodChannel('immich/httpSSLOptions');

  static void apply() {
    SSLClientCertStoreVal? clientCert = SSLClientCertStoreVal.load();
    HttpOverrides.global = HttpSSLCertOverride(clientCert);
    if (Platform.isAndroid) {
      _channel.invokeMethod("apply", [clientCert?.data, clientCert?.password]);
    }
  }
}
