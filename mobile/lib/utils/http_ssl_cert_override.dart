import 'dart:convert';
import 'dart:io';

import 'package:immich_mobile/entities/store.entity.dart';
import 'package:logging/logging.dart';

class HttpSSLCertOverride extends HttpOverrides {
  static final Logger _log = Logger("HttpSSLCertOverride");
  final bool _allowSelfSignedSSLCert;
  final String? _serverHost;
  final SSLClientCertStoreVal? _clientCert;
  final Map<String, String>? _androidUserPemCertsByName;
  late final SecurityContext _customCtx;

  HttpSSLCertOverride(
    this._allowSelfSignedSSLCert,
    this._serverHost,
    this._clientCert,
    this._androidUserPemCertsByName,
  ) {
    _customCtx = SecurityContext(withTrustedRoots: true);
    _configureSecurityContext(_customCtx);
  }

  void _configureSecurityContext(SecurityContext ctx) {
    if (_clientCert != null) {
      setClientCert(ctx, _clientCert);
    }

    // Extend the default security context to trust Android user certificates.
    // This is a workaround for <https://github.com/dart-lang/sdk/issues/50435>.
    if (_androidUserPemCertsByName != null) {
      for (var entry in _androidUserPemCertsByName.entries) {
        final pemCert = entry.value;
        ctx.setTrustedCertificatesBytes(utf8.encode(pemCert));
      }
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
      _configureSecurityContext(context);
    } else {
      context = _customCtx;
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
