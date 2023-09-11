import 'dart:io';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:logging/logging.dart';

class HttpSSLCertOverride extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) {
        var log = Logger("HttpSSLCertOverride");
        bool selfSignedCertsAllowed = AppSettingsService.getSettingStatic(
              AppSettingsEnum.allowSelfSignedSSLCert,
            ) ??
            false;
        if (!selfSignedCertsAllowed) {
          log.severe("Invalid SSL certificate for $host:$port");
        }
        return selfSignedCertsAllowed;
      };
  }
}
