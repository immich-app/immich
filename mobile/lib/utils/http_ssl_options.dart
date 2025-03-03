import 'dart:io';

import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';

class HttpSSLOptions {
  static const MethodChannel _channel = MethodChannel('immich/httpSSLOptions');

  static void apply() {
    AppSettingsEnum setting = AppSettingsEnum.allowSelfSignedSSLCert;
    bool allowSelfSignedSSLCert =
        Store.get(setting.storeKey as StoreKey<bool>, setting.defaultValue);
    String? serverHost;
    if (allowSelfSignedSSLCert && Store.tryGet(StoreKey.currentUser) != null) {
      serverHost = Uri.parse(Store.tryGet(StoreKey.serverEndpoint) ?? "").host;
    }

    SSLClientCertStoreVal? clientCert = SSLClientCertStoreVal.load();

    HttpOverrides.global =
        HttpSSLCertOverride(allowSelfSignedSSLCert, serverHost, clientCert);

    if (Platform.isAndroid) {
      _channel.invokeMethod("apply", [
        clientCert?.data,
        clientCert?.password,
      ]);
    }
  }
}
