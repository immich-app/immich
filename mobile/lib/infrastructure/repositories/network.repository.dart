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

  /// 和 [_clientPointer] 分开记：装证书时指针不变，但能连的传输层变了。
  static bool _usingMtls = false;

  static Future<void> init() async {
    final clientPointer = Pointer<Void>.fromAddress(await networkApi.getClientPointer());
    // 算在「要不要重建」的判断里：装了证书就必须重建客户端。
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
      // Cronet 出不了客户端证书。
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
      // 保持包装对象的身份，调用方持有它的快照。
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
      // 只有原生客户端有证书，dart:io 出不了。
      return OkHttpWebSocket.connectFromJniGlobalRef(_clientPointer!, uri, protocols: protocols);
    }
    // Cronet 没有 WebSocket 接口，OkHttp 的 provider 也没有 ML-KEM 组，
    // 两者都会掉到 REST 流量之下。
    final authHeaders = await networkApi.requestAuthHeaders(_httpEquivalent(uri).toString());
    return IoWebSocket.connect(uri, headers: {...authHeaders, ...?headers}, protocols: protocols);
  }

  /// OkHttp 的 `HttpUrl` 不认 `ws`/`wss`。
  static Uri _httpEquivalent(Uri uri) => switch (uri.scheme) {
    'wss' => uri.replace(scheme: 'https'),
    'ws' => uri.replace(scheme: 'http'),
    _ => uri,
  };

  /// Cronet 的 cookie store 没有清空接口，只能重建引擎。
  static Future<void> clearCookies() async {
    await networkApi.clearCookies();
    if (Platform.isAndroid && !_usingMtls) {
      final current = _client;
      if (current is _CronetAuthClient) {
        current.reset(await _buildCronetClient());
      }
    }
  }

  /// 每个 isolate 建自己的引擎，占线程和 64MB 缓存。
  static void dispose() {
    _client?.close();
    _client = null;
    _clientPointer = null;
    _usingMtls = false;
  }

  /// 带原生 SSL 配置的共享 HTTP 客户端。先调 [init]。
  ///
  /// 抛异常而不是空指针解引用：后台 isolate 清理时会释放客户端，
  /// 迟到的请求否则直接崩。
  static http.Client get client {
    final client = _client;
    if (client == null) {
      throw StateError('NetworkRepository.client used before init(), or after dispose()');
    }
    return client;
  }

  /// 当前是不是 OkHttp。绕过 [client] 的代码必须先看这个。
  static bool get usingMtls => _usingMtls;
}

/// 复制原生客户端会加的 header，Cronet 没有拦截器。
class _CronetAuthClient extends http.BaseClient {
  _CronetAuthClient(this._inner);

  http.Client _inner;

  /// 上一次 [reset] 留下的、还在宽限期内的引擎。
  http.Client? _pendingClose;

  /// 换掉底层客户端，但对象身份不变。
  ///
  /// 旧引擎延迟关闭：`shutdown()` 会取消在途请求，那些中断会被当成用户取消。
  void reset(http.Client inner) {
    final previous = _inner;
    _inner = inner;

    // 这次 reset 让上一个引擎不必再等了。
    final superseded = _pendingClose;
    _pendingClose = previous;
    if (superseded != null) {
      _closeQuietly(superseded);
    }

    unawaited(
      Future<void>.delayed(const Duration(seconds: 30), () {
        // 只有最新的引擎还在宽限期。
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
      // 尽力而为，这里失败不能让登出挂掉。
    }
  }

  /// 换主机时不能带过去。
  static const _sensitiveHeaders = {'cookie', 'authorization', 'proxy-authorization'};

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    // Cronet 重定向时重放同一个 UrlRequest，Cookie 和 Authorization 会跟到目标。
    // OkHttp 换主机时会剥掉；地址输错或被劫持时回个 302，token 就送出去了。
    //
    // 所以这里自己一跳一跳地跟，每跳重算 header。
    var current = request;
    final firstHost = request.url.host;
    var hops = 0;

    if (!_canReplay(current)) {
      // body 已经 finalize，交给 Cronet 自己跟。
      await _applyAuthHeaders(current, sameHost: true);
      return _inner.send(current);
    }

    while (true) {
      await _applyAuthHeaders(current, sameHost: current.url.host == firstHost);
      // 否则 Cronet 会抢先跟掉。
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
      // 301/302/303 丢 body，307/308 保留。
      final next = _cloneForRedirect(current, nextUrl, keepBody: response.statusCode == 307 || response.statusCode == 308);
      if (next == null) {
        return response;
      }

      hops++;
      current = next;
    }
  }

  /// 只有放在内存里的 body 能重发。
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

  /// 把原生 header 写到 [request]，跨主机时丢掉凭据。
  /// 是删掉而不是不加，因为克隆出来的请求带着上一跳的 header。
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
