import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// A dummy localhost server that implements only the endpoints that remote-sync touches.
class FakeImmichServer {
  FakeImmichServer._(this._server, this.version);

  final HttpServer _server;
  final (int, int, int) version;

  final Completer<SyncStream> _streamOpened = Completer<SyncStream>();
  final List<SyncStream> _streamOpens = [];
  final Map<int, Completer<SyncStream>> _openWaiters = {};

  int ackRequests = 0;

  String get endpoint => 'http://${_server.address.host}:${_server.port}/api';

  /// Resolves when the sync isolate opens `POST /sync/stream`.
  Future<SyncStream> get streamOpened => _streamOpened.future;

  /// How many `/sync/stream` requests have opened so far.
  int get streamOpenCount => _streamOpens.length;

  /// Resolves when the [n]-th (1-indexed) `/sync/stream` opens.
  Future<SyncStream> streamOpenedNth(int n) {
    if (_streamOpens.length >= n) {
      return Future.value(_streamOpens[n - 1]);
    }
    return (_openWaiters[n] ??= Completer<SyncStream>()).future;
  }

  static Future<FakeImmichServer> start({(int, int, int) version = (3, 0, 0)}) async {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final fake = FakeImmichServer._(server, version);
    fake._listen();
    return fake;
  }

  void _listen() {
    // A connection torn down mid-write during teardown is expected
    _server.listen((request) => unawaited(_route(request).catchError((_) {})));
  }

  Future<void> _route(HttpRequest request) async {
    final method = request.method;
    final path = request.uri.path;

    if (method == 'GET' && path == '/api/server/ping') {
      return _respondJson(request, {'res': 'pong'});
    }
    if (method == 'GET' && path == '/api/server/version') {
      final (major, minor, patch) = version;
      return _respondJson(request, {'major': major, 'minor': minor, 'patch': patch});
    }
    if (path == '/api/sync/ack') {
      if (method != 'DELETE') {
        ackRequests++;
      }
      return _respondEmpty(request);
    }
    if (method == 'POST' && path == '/api/sync/stream') {
      return _openSyncStream(request);
    }
    return _respondEmpty(request, status: HttpStatus.notFound);
  }

  Future<void> _openSyncStream(HttpRequest request) async {
    await request.drain<void>();
    request.response
      ..statusCode = HttpStatus.ok
      ..headers.contentType = ContentType('application', 'jsonlines+json')
      ..contentLength =
          -1 // chunked: stays open to stream incrementally
      ..bufferOutput = false;
    // Flush headers so the client's send() resolves and enters its read loop.
    await request.response.flush();
    final stream = SyncStream._(request.response);
    _streamOpens.add(stream);
    if (!_streamOpened.isCompleted) {
      _streamOpened.complete(stream);
    }
    _openWaiters.remove(_streamOpens.length)?.complete(stream);
  }

  Future<void> _respondJson(HttpRequest request, Object body) async {
    await request.drain<void>();
    request.response
      ..statusCode = HttpStatus.ok
      ..headers.contentType = ContentType.json
      ..write(jsonEncode(body));
    await request.response.close();
  }

  Future<void> _respondEmpty(HttpRequest request, {int status = HttpStatus.ok}) async {
    await request.drain<void>();
    request.response.statusCode = status;
    await request.response.close();
  }

  Future<void> close() async {
    for (final stream in _streamOpens) {
      await stream.close();
    }
    await _server.close(force: true);
  }
}

/// Handle to the open `/sync/stream` response: push jsonlines events, then end.
class SyncStream {
  SyncStream._(this._response);

  final HttpResponse _response;
  bool _closed = false;

  /// [data] should be a Sync*V1 DTO's `toJson()` so the parser's `fromJson` round-trips it.
  void send({required String type, required Object data, required String ack}) {
    if (_closed) {
      return;
    }
    _response.write('${jsonEncode({'type': type, 'data': data, 'ack': ack})}\n');
  }

  Future<void> close() async {
    if (_closed) {
      return;
    }
    _closed = true;
    await _response.close();
  }
}
