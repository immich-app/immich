import 'dart:io';

import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';

class HttpSSLOptions {
  static void apply() {
    SSLClientCertStoreVal? clientCert = SSLClientCertStoreVal.load();
    HttpOverrides.global = HttpSSLCertOverride(clientCert);
  }
}
