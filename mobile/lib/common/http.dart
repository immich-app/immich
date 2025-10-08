import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart';
import 'package:http/io_client.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/user_agent.dart';
import 'package:ok_http/ok_http.dart';

/// Top-level function for compute isolate to load private key and certificate chain
/// This must be top-level to work with compute()
(PrivateKey?, List<X509Certificate>?) _loadPrivateKeyAndCertificateChainFromAliasCompute(String alias) {
  PrivateKey? pkey;
  List<X509Certificate>? certs;
  (pkey, certs) = loadPrivateKeyAndCertificateChainFromAlias(alias);
  return (pkey, certs);
}

class _ImmichHttpClientSingleton {
  static _ImmichHttpClientSingleton? _instance;
  Client? _client;

  _ImmichHttpClientSingleton._();

  static _ImmichHttpClientSingleton get instance {
    _instance ??= _ImmichHttpClientSingleton._();
    return _instance!;
  }

  Client getClient() {
    if (_client == null) {
      throw "Client is not initialized!";
    }
    return _client!;
  }

  /// Refreshes the HTTP client with proper async handling to avoid main thread deadlocks
  Future<void> refreshClient() async {
    String userAgent = getUserAgentString();
    if (Platform.isAndroid) {
      // Unfortunately cronet doesn't support mTLS - so we use OkHttpClient
      String pKeyAlias = SSLClientCertStoreVal.load()?.privateKeyAlias ?? "";
      PrivateKey? pKey;
      List<X509Certificate>? certs;
      if (pKeyAlias != "") {
        // Run this in a compute isolate to avoid main thread deadlocks
        (pKey, certs) = await compute(_loadPrivateKeyAndCertificateChainFromAliasCompute, pKeyAlias);
      }
      OkHttpClient okHttpClient = OkHttpClient(
        configuration: OkHttpClientConfiguration(
          clientPrivateKey: pKey,
          clientCertificateChain: certs,
          validateServerCertificates: true,
          userAgent: userAgent,
        ),
      );
      _client = okHttpClient;
    } else {
      _client = IOClient(HttpClient()..userAgent = userAgent);
    }
  }

  void dispose() {
    _client?.close();
    _client = null;
  }
}

/// Creates an optimized HTTP client based on the platform (singleton pattern)
///
/// On Android, uses CronetEngine for better performance with memory caching
/// On other platforms, falls back to standard HTTP client
/// Returns the same client instance for all calls after first initialization
Client immichHttpClient() {
  return _ImmichHttpClientSingleton.instance.getClient();
}

Future<void> refreshClient() async {
  return _ImmichHttpClientSingleton.instance.refreshClient();
}
