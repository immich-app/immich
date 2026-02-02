import 'dart:io';

import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';

class HttpSSLOptions {
  static void apply() {
    AppSettingsEnum setting = AppSettingsEnum.allowSelfSignedSSLCert;
    bool allowSelfSignedSSLCert = Store.get(setting.storeKey as StoreKey<bool>, setting.defaultValue);
    return _apply(allowSelfSignedSSLCert);
  }

  static void applyFromSettings(bool newValue) => _apply(newValue);

  static void _apply(bool allowSelfSignedSSLCert) {
    String? serverHost;
    if (allowSelfSignedSSLCert && Store.tryGet(StoreKey.currentUser) != null) {
      serverHost = Uri.parse(Store.tryGet(StoreKey.serverEndpoint) ?? "").host;
    }

    SSLClientCertStoreVal? clientCert = SSLClientCertStoreVal.load();

    HttpOverrides.global = HttpSSLCertOverride(allowSelfSignedSSLCert, serverHost, clientCert);
  }
}
