import 'dart:async';
import 'dart:ffi';
import 'dart:io';

import 'package:cronet_http/cronet_http.dart';
import 'package:cupertino_http/cupertino_http.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/infrastructure/repositories/io_web_socket.dart';
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

  static Future<WebSocket> createWebSocket(Uri uri, {Map<String, String>? headers, Iterable<String>? protocols}) async {
    if (Platform.isIOS) {
      final session = URLSession.fromRawPointer(_clientPointer!.cast());
      return CupertinoWebSocket.connectWithSession(session, uri, protocols: protocols);
    }
    if (_usingMtls) {
      // A client certificate only exists on the native OkHttp client, and
      // dart:io cannot present one.
      return OkHttpWebSocket.connectFromJniGlobalRef(_clientPointer!, uri, protocols: protocols);
    }
    // Every transport except dart:io negotiates a classical key exchange here:
    // Cronet exposes no WebSocket API, and OkHttp goes through the platform
    // Conscrypt provider, which has no ML-KEM group. The socket would then
    // silently drop below the post-quantum level of the REST traffic.
    final authHeaders = await networkApi.requestAuthHeaders(_httpEquivalent(uri).toString());
    return IoWebSocket.connect(uri, headers: {...authHeaders, ...?headers}, protocols: protocols);
  }

  /// The native header/cookie lookup goes through OkHttp's `HttpUrl`, which
  /// rejects the `ws`/`wss` schemes, so ask for the equivalent http(s) URL.
  static Uri _httpEquivalent(Uri uri) => switch (uri.scheme) {
    'wss' => uri.replace(scheme: 'https'),
    'ws' => uri.replace(scheme: 'http'),
    _ => uri,
  };

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
  ///
  /// Throws instead of returning null when [dispose] already ran: a background
  /// isolate disposes its client during cleanup, and a late request (or a provider
  /// disposed after it) would otherwise crash on a null check with no clue about
  /// the cause.
  static http.Client get client {
    final client = _client;
    if (client == null) {
      throw StateError('NetworkRepository.client used before init(), or after dispose()');
    }
    return client;
  }

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

  /// The engine from the last [reset] that is still waiting out its grace period.
  /// A second reset inside that window closes the older one immediately instead of
  /// leaving three engines alive at 64 MiB each.
  http.Client? _pendingClose;

  /// Swaps the underlying client without changing this object's identity.
  ///
  /// The old engine is closed on a delay: `CronetEngine.shutdown()` cancels every
  /// in-flight request, and those aborts reach the upload path as
  /// `RequestAbortedException`, which it treats as a user cancellation.
  void reset(http.Client inner) {
    final previous = _inner;
    _inner = inner;

    // This reset cuts the previous grace period short, so that engine no longer
    // needs protecting; close it now rather than after another 30 seconds.
    final superseded = _pendingClose;
    _pendingClose = previous;
    if (superseded != null) {
      _closeQuietly(superseded);
    }

    unawaited(
      Future<void>.delayed(const Duration(seconds: 30), () {
        // Only the newest engine is still on grace; an older one was either
        // already closed above or is about to be by its own callback.
        if (identical(_pendingClose, previous)) {
          _pendingClose = null;
        }
        _closeQuietly(previous);
      }),
    );
  }

  void _closeQuietly(http.Client client) {
    try {
      client.close();
    } catch (_) {
      // Closing is best-effort: a failure here must not break logout.
    }
  }

  /// Headers that must not travel to a redirect target on a different host.
  static const _sensitiveHeaders = {'cookie', 'authorization', 'proxy-authorization'};

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    // Cronet replays the same UrlRequest across redirects, so Cookie/Authorization
    // set once would also reach the redirect target. OkHttp strips them when the
    // host changes, and that matters here: a hijacked or mistyped server URL
    // answering 302 would receive the user's access token.
    //
    // Redirects are therefore followed here, one hop at a time, recomputing the
    // headers against each hop's URL. Automatic following stays on for requests
    // whose body cannot be re-issued from this layer -- Cronet buffers the body,
    // so it can replay it, while a MultipartRequest has already been finalised.
    var current = request;
    final firstHost = request.url.host;
    var hops = 0;

    if (!_canReplay(current)) {
      // Cronet follows this one itself; nothing this loop could do with an
      // already-finalised body. Headers still come from the native client.
      await _applyAuthHeaders(current, sameHost: true);
      return _inner.send(current);
    }

    while (true) {
      await _applyAuthHeaders(current, sameHost: current.url.host == firstHost);
      // Cronet's own following must stay off for the hops this loop handles, or
      // it would follow them before the response reaches us.
      current.followRedirects = false;
      final response = await _inner.send(current);

      if (!response.isRedirect || hops >= request.maxRedirects) {
        return response;
      }

      final location = response.headers['location'];
      if (location == null) {
        return response;
      }

      final nextUrl = current.url.resolve(location);
      // 301/302/303 rewrite the method to GET and drop the body; 307/308 keep it.
      final next = _cloneForRedirect(current, nextUrl, keepBody: response.statusCode == 307 || response.statusCode == 308);
      if (next == null) {
        return response;
      }

      hops++;
      current = next;
    }
  }

  /// Whether this loop can re-issue the request at a new location.
  ///
  /// Only bodies that live in memory qualify: [http.Request] keeps its bytes, and
  /// an empty body needs none. A [http.MultipartRequest] or [http.StreamedRequest]
  /// has already handed its stream to the engine, so a second send would upload
  /// nothing -- those keep Cronet's own redirect following, which rewinds the
  /// upload provider itself.
  static bool _canReplay(http.BaseRequest request) =>
      request is http.Request || request.contentLength == 0;

  http.BaseRequest? _cloneForRedirect(http.BaseRequest from, Uri to, {required bool keepBody}) {
    final copy = http.Request(keepBody ? from.method : 'GET', to);
    copy.followRedirects = false;
    copy.headers.addAll(from.headers);
    if (keepBody && from is http.Request) {
      copy.bodyBytes = from.bodyBytes;
    }
    return copy;
  }

  /// Copies the headers the native client would attach onto [request].
  ///
  /// Credentials are dropped when the hop leaves the original host, matching what
  /// OkHttp does on a cross-host redirect. They are *removed*, not merely not
  /// re-added: a clone made by [_cloneForRedirect] starts with the previous hop's
  /// headers, so skipping the assignment would leave the token in place.
  Future<void> _applyAuthHeaders(http.BaseRequest request, {required bool sameHost}) async {
    if (!sameHost) {
      _sensitiveHeaders.forEach(request.headers.remove);
    }
    final headers = await networkApi.requestAuthHeaders(request.url.toString());
    headers.forEach((k, v) {
      if (!sameHost && _sensitiveHeaders.contains(k.toLowerCase())) {
        return;
      }
      request.headers[k] = v;
    });
  }

  @override
  void close() => _inner.close();
}
