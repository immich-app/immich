import 'package:flutter/services.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';

class HttpSSLOptions {
  static const MethodChannel _channel = MethodChannel('immich/httpSSLOptions');

  static void apply({bool applyNative = true}) {
    AppSettingsEnum setting = AppSettingsEnum.allowSelfSignedSSLCert;
    bool allowSelfSignedSSLCert = Store.get(setting.storeKey as StoreKey<bool>, setting.defaultValue);

    // Check if user certificates are enabled
    bool useUserCerts = Store.get(
      AppSettingsEnum.useUserCertificates.storeKey,
      AppSettingsEnum.useUserCertificates.defaultValue,
    );

    if (useUserCerts) {
      _applyWithUserCertificates(allowSelfSignedSSLCert, applyNative: applyNative);
    } else {
      _apply(allowSelfSignedSSLCert, applyNative: applyNative);
    }
  }

  static void applyFromSettings(bool newValue) {
    // Check if user certificates are enabled
    bool useUserCerts = Store.get(
      AppSettingsEnum.useUserCertificates.storeKey,
      AppSettingsEnum.useUserCertificates.defaultValue,
    );

    if (useUserCerts) {
      _applyWithUserCertificates(newValue);
    } else {
      _apply(newValue);
    }
  }

  static void applyWithUserCertificates({bool applyNative = true}) {
    AppSettingsEnum setting = AppSettingsEnum.allowSelfSignedSSLCert;
    bool allowSelfSignedSSLCert = Store.get(setting.storeKey as StoreKey<bool>, setting.defaultValue);
    _applyWithUserCertificates(allowSelfSignedSSLCert, applyNative: applyNative);
  }

  static void _apply(bool allowSelfSignedSSLCert, {bool applyNative = true}) {
    String? serverHost;
    if (allowSelfSignedSSLCert && Store.tryGet(StoreKey.currentUser) != null) {
      serverHost = Uri.parse(Store.tryGet(StoreKey.serverEndpoint) ?? "").host;
    }

    // HttpOverrides.global = HttpSSLCertOverride(allowSelfSignedSSLCert, serverHost, clientCert);

    // if (applyNative && Platform.isAndroid) {
    //   _channel
    //       .invokeMethod("apply", [allowSelfSignedSSLCert, serverHost, clientCert?.data, clientCert?.password])
    //       .onError<PlatformException>((e, _) {
    //         final log = Logger("HttpSSLOptions");
    //         log.severe('Failed to set SSL options', e.message);
    //       });
    // }
  }

  static void _applyWithUserCertificates(bool allowSelfSignedSSLCert, {bool applyNative = true}) {
    String? serverHost;
    if (Store.tryGet(StoreKey.currentUser) != null) {
      serverHost = Uri.parse(Store.tryGet(StoreKey.serverEndpoint) ?? "").host;
    }

    // Create SSL override that uses user certificates from system store
    // HttpOverrides.global = HttpSSLCertOverride(allowSelfSignedSSLCert, serverHost, null);

    // if (applyNative) {
    //   _channel
    //       .invokeMethod("applyWithUserCertificates", [serverHost, allowSelfSignedSSLCert])
    //       .onError<PlatformException>((e, _) {
    //         final log = Logger("HttpSSLOptions");
    //         log.severe('Failed to set SSL options with user certificates', e.message);
    //       });
    // }
  }

  static Future<List<Map<String, String>>> getAvailableUserCertificates() async {
    try {
      final List<dynamic> certificates = await _channel.invokeMethod("getAvailableCertificates");
      return certificates.map((cert) => Map<String, String>.from(cert)).toList();
    } catch (e) {
      final log = Logger("HttpSSLOptions");
      log.severe('Failed to get available user certificates: $e');
      return [];
    }
  }
}
