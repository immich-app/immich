import 'dart:io';

import 'package:immich_mobile/entities/store.entity.dart';
import 'package:logging/logging.dart';

class HttpSSLCertOverride extends HttpOverrides {
  static final Logger _log = Logger("HttpSSLCertOverride");
  final bool _allowSelfSignedSSLCert;
  final String? _serverHost;
  final SSLClientCertStoreVal? _clientCert;
  late final SecurityContext? _ctxWithCert;

  HttpSSLCertOverride(
    this._allowSelfSignedSSLCert,
    this._serverHost,
    this._clientCert,
  ) {
    if (_clientCert != null) {
      _ctxWithCert = SecurityContext(withTrustedRoots: true);
      if (_ctxWithCert != null) {
        setClientCert(_ctxWithCert, _clientCert);
      } else {
        _log.severe("Failed to create security context with client cert!");
      }
    } else {
      _ctxWithCert = null;
    }
  }

  static bool setClientCert(SecurityContext ctx, SSLClientCertStoreVal cert) {
    try {
      _log.info("Setting client certificate");
      ctx.usePrivateKeyBytes(cert.data, password: cert.password);
      ctx.useCertificateChainBytes(cert.data, password: cert.password);
    } catch (e) {
      _log.severe("Failed to set SSL client cert: $e");
      return false;
    }
    return true;
  }

  @override
  HttpClient createHttpClient(SecurityContext? context) {
    if (context != null) {
      if (_clientCert != null) {
        setClientCert(context, _clientCert);
      }
    } else {
      context = _ctxWithCert;
    }

    return super.createHttpClient(context)
      ..badCertificateCallback = (X509Certificate cert, String host, int port) {
        if (_allowSelfSignedSSLCert) {
          // Conduct server host checks if user is logged in to avoid making
          // insecure SSL connections to services that are not the immich server.
          if (_serverHost == null || _serverHost.contains(host)) {
            return true;
          }
        }
        _log.severe("Invalid SSL certificate for $host:$port");
        return false;
      };
  }
}
