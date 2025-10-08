import 'dart:io';

import 'package:logging/logging.dart';

class HttpSSLCertOverride extends HttpOverrides {
  static final Logger _log = Logger("HttpSSLCertOverride");
  final bool _allowSelfSignedSSLCert;
  final String? _serverHost;

  HttpSSLCertOverride(this._allowSelfSignedSSLCert, this._serverHost);

  @override
  HttpClient createHttpClient(SecurityContext? context) {
    // Use system trust store with trusted roots if no client certificate is provided
    context = SecurityContext(withTrustedRoots: true);

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
