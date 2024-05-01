import 'dart:io';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:logging/logging.dart';

class HttpSSLCertOverride extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) {
        var log = Logger("HttpSSLCertOverride");

        AppSettingsEnum setting = AppSettingsEnum.allowSelfSignedSSLCert;

        // Check if user has allowed self signed SSL certificates.
        bool selfSignedCertsAllowed =
            Store.get(setting.storeKey as StoreKey<bool>, setting.defaultValue);

        bool isLoggedIn = Store.tryGet(StoreKey.currentUser) != null;

        // Conduct server host checks if user is logged in to avoid making
        // insecure SSL connections to services that are not the immich server.
        if (isLoggedIn && selfSignedCertsAllowed) {
          String serverHost =
              Uri.parse(Store.tryGet(StoreKey.serverEndpoint) ?? "").host;

          selfSignedCertsAllowed &= serverHost.contains(host);
        }

        if (!selfSignedCertsAllowed) {
          log.severe("Invalid SSL certificate for $host:$port");
        }

        return selfSignedCertsAllowed;
      };
  }
}
