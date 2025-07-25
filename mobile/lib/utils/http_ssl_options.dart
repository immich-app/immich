import 'dart:io';

import 'package:flutter/services.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/platform/user_certificates_api.g.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';
import 'package:logging/logging.dart';

class HttpSSLOptions {
  static const MethodChannel _channel = MethodChannel('immich/httpSSLOptions');

  static Future<void> apply({bool applyNative = true}) async {
    await _apply(applyNative: applyNative);
  }

  static Future<void> _apply({bool applyNative = true}) async {
    SSLClientCertStoreVal? clientCert = SSLClientCertStoreVal.load();

    // User certificates are an Android specific concept. There's nothing to do
    // on other platforms.
    final androidUserPemCertsByName = Platform.isAndroid
        ? await UserCertificatesApi().getUserPemCertificatesByName()
        : null;

    HttpOverrides.global = HttpSSLCertOverride(clientCert, androidUserPemCertsByName);

    if (applyNative && Platform.isAndroid) {
      _channel.invokeMethod("apply", [clientCert?.data, clientCert?.password]).onError<PlatformException>((e, _) {
        final log = Logger("HttpSSLOptions");
        log.severe('Failed to set SSL options', e.message);
      });
    }
  }
}
