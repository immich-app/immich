import 'dart:async';
import 'dart:ffi';
import 'dart:io';

import 'package:cronet_http/cronet_http.dart';
import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:ok_http/ok_http.dart';
import 'package:web_socket/web_socket.dart';

class NetworkRepository {
  static http.Client? _client;
  static Pointer<Void>? _clientPointer;

  /// Tracked separately from [_clientPointer]: installing or removing a client
  /// certificate keeps the pointer but changes which transport can connect.
  static bool _usingMtls = false;

  static Future<void> init() async {
    final clientPointer = Pointer<Void>.fromAddress(await networkApi.getClientPointer());
    // Part of the "nothing to do" check: installing a certificate after init()
    // would otherwise leave Cronet in place and every request would fail.
    final mtls = Platform.isIOS ? false : await networkApi.hasCertificate();
    if (clientPointer == _clientPointer && mtls == _usingMtls) {
      return;
    }
    _clientPointer = clientPointer;
    _usingMtls = mtls;
    if (Platform.isIOS) {
      _client?.close();
      final session = URLSession.fromRawPointer(clientPointer.cast());
      _client = CupertinoClient.fromSharedSession(session);
    } else if (mtls) {
      // Cronet cannot present a client certificate, so mTLS users stay on the
      // native OkHttp client.
      _client?.close();
      _client = OkHttpClient.fromJniGlobalRef(
        clientPointer,
        configuration: const OkHttpClientConfiguration(
          connectTimeout: Duration(seconds: 30),
          readTimeout: Duration(seconds: 60),
          writeTimeout: Duration(seconds: 60),
        ),
      );
    } else {
      // Keep the wrapper identity stable: callers hold a snapshot of it
      // (ApiService._apiClient.client), so replacing it would leave them holding a
      // closed client.
      final engine = await _buildCronetClient();
      final current = _client;
      if (current is _CronetAuthClient) {
        current.reset(engine);
      } else {
        _client?.close();
        _client = _CronetAuthClient(engine);
      }
    }
  }

  static Future<http.Client> _buildCronetClient() async {
    final engine = CronetEngine.build(
      cacheMode: CacheMode.memory,
      cacheMaxSize: 64 * 1024 * 1024,
      enableBrotli: true,
      enableHttp2: true,
      enableQuic: true,
      userAgent: await networkApi.getCronetUserAgent(),
    );
    return CronetClient.fromCronetEngine(engine, closeEngine: true);
  }

  static Future<void> setHeaders(Map<String, String> headers, List<String> serverUrls, {String? token}) async {
    await networkApi.setRequestHeaders(headers, serverUrls, token);
    if (Platform.isIOS) {
      await init();
    }
  }

  // ignore: avoid-unused-parameters
  static Future<WebSocket> createWebSocket(Uri uri, {Map<String, String>? headers, Iterable<String>? protocols}) {
    if (Platform.isIOS) {
      final session = URLSession.fromRawPointer(_clientPointer!.cast());
      return CupertinoWebSocket.connectWithSession(session, uri, protocols: protocols);
    } else {
      return OkHttpWebSocket.connectFromJniGlobalRef(_clientPointer!, uri, protocols: protocols);
    }
  }

  /// Clears the session cookies. The native jar is cleared directly; Cronet's own
  /// cookie store has no clear API, so the engine is replaced in place.
  static Future<void> clearCookies() async {
    await networkApi.clearCookies();
    if (Platform.isAndroid && !_usingMtls) {
      final current = _client;
      if (current is _CronetAuthClient) {
        current.reset(await _buildCronetClient());
      }
    }
  }

  /// Releases the client and the native engine behind it. Each isolate builds its
  /// own engine, holding native threads and a 64 MiB cache until `shutdown()`.
  static void dispose() {
    _client?.close();
    _client = null;
    _clientPointer = null;
    _usingMtls = false;
  }

  /// Shared HTTP client with native SSL configuration. Must call [init] first.
  static http.Client get client => _client!;

  /// Whether the active client is OkHttp because a client certificate is
  /// installed. Callers that bypass [client] -- the native streaming uploader
  /// talks to Cronet directly -- must consult this first.
  static bool get usingMtls => _usingMtls;
}

/// Attaches the headers the native client would have attached: Cronet cannot be
/// given OkHttp-style interceptors, so they are copied onto each request.
class _CronetAuthClient extends http.BaseClient {
  _CronetAuthClient(this._inner);

  http.Client _inner;

  /// Swaps the underlying client without changing this object's identity.
  ///
  /// The old engine is closed on a delay: `CronetEngine.shutdown()` cancels every
  /// in-flight request, and those aborts reach the upload path as
  /// `RequestAbortedException`, which it treats as a user cancellation.
  void reset(http.Client inner) {
    final previous = _inner;
    _inner = inner;
    unawaited(
      Future<void>.delayed(const Duration(seconds: 30), () {
        try {
          previous.close();
        } catch (_) {
          // Closing is best-effort: a failure here must not break logout.
        }
      }),
    );
  }

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    // The native client owns header construction (persisted headers, cookie jar,
    // Basic credentials in the URL), so copy its answer rather than rebuilding it.
    //
    // Overwrite unconditionally, matching the OkHttp interceptor this replaces:
    // user-configured headers must win over the API client's defaults.
    final headers = await networkApi.requestAuthHeaders(request.url.toString());
    headers.forEach((k, v) => request.headers[k] = v);

    // Cronet replays the same UrlRequest across redirects, so Cookie/Authorization
    // travel to the redirect target too (OkHttp strips them on host change).
    // Automatic following stays on because Immich deployments commonly rely on a
    // same-origin http -> https 301 at the reverse proxy.
    return _inner.send(request);
  }

  @override
  void close() => _inner.close();
}
