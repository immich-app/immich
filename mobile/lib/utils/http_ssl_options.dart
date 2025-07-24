import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';
import 'package:logging/logging.dart';

class HttpSSLOptions {
  static const MethodChannel _channel = MethodChannel('immich/httpSSLOptions');

  static void apply() {
    AppSettingsEnum setting = AppSettingsEnum.allowSelfSignedSSLCert;
    bool allowSelfSignedSSLCert =
        Store.get(setting.storeKey as StoreKey<bool>, setting.defaultValue);
    _apply(allowSelfSignedSSLCert);
  }

  static void applyFromSettings(bool newValue) {
    _apply(newValue);
  }

  static void _apply(bool allowSelfSignedSSLCert) async {
    String? serverHost;
    if (allowSelfSignedSSLCert && Store.tryGet(StoreKey.currentUser) != null) {
      serverHost = Uri.parse(Store.tryGet(StoreKey.serverEndpoint) ?? "").host;
    }

    SSLClientCertStoreVal? clientCert = SSLClientCertStoreVal.load();

    HttpOverrides.global =
        HttpSSLCertOverride(allowSelfSignedSSLCert, serverHost, clientCert);

    if (Platform.isAndroid) {
      _channel.invokeMethod("apply", [
        allowSelfSignedSSLCert,
        serverHost,
        clientCert?.data,
        clientCert?.password,
      ]).onError<PlatformException>((e, _) {
        final log = Logger("HttpSSLOptions");
        log.severe('Failed to set SSL options', e.message);
      });

      final res = await _channel
          .invokeMethod("getUserCertificates")
          .onError<PlatformException>((e, _) {
        final log = Logger("HttpSSLOptions");
        log.severe('Failed to load user certificates', e.message);
      });
      final certs = res?.cast<String, Uint8List>();
      if (certs == null) {
        return;
      }
      for (var entry in certs.entries) {
        final pemData =
            '-----BEGIN CERTIFICATE-----\n${base64Encode(entry.value)}\n-----END CERTIFICATE-----';
        SecurityContext.defaultContext
            .setTrustedCertificatesBytes(utf8.encode(pemData));
      }
    }
  }
}
