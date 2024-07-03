import 'dart:io';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:logging/logging.dart';

class HttpSSLCertOverride extends HttpOverrides {
  final Logger _log;
  final SSLClientCertStoreVal? _clientCert;
  late final SecurityContext? _ctxWithCert;

  HttpSSLCertOverride()
  : _log = Logger("HttpSSLCertOverride")
  , _clientCert = SSLClientCertStoreVal.load() {
    if (_clientCert != null) {
      _ctxWithCert = SecurityContext(withTrustedRoots: true);
      if (_ctxWithCert != null) {
        setClientCert(_ctxWithCert);
      } else {
        _log.severe("Failed to create security context with client cert!");
      }
    } else {
      _ctxWithCert = null;
    }
  }

  void setClientCert(SecurityContext ctx) {
    if (_clientCert != null) {
      _log.info("Setting client certificate");
      ctx.usePrivateKeyBytes(_clientCert.data, password: _clientCert.password);
      if (!Platform.isIOS) {
        ctx.useCertificateChainBytes(_clientCert.data, password: _clientCert.password);
      }
    }
  }

  @override
  HttpClient createHttpClient(SecurityContext? context) {
    if (context != null) {
      setClientCert(context);
    } else {
      context = _ctxWithCert;
    }

    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) {

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
          _log.severe("Invalid SSL certificate for $host:$port");
        }

        return selfSignedCertsAllowed;
      };
  }
}
