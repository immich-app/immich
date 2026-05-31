// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// The HTTP transport + (de)serialization core shared by every `XxxApi` class.
///
/// [basePath] and [client] are mutable so the host app can repoint the client
/// at a different server or inject a custom (e.g. platform-native or mocked)
/// `http.Client` at runtime. JSON decoding runs on a background isolate via
/// [compute] to keep large payloads off the UI thread.
class ApiClient {
  ApiClient({this.basePath = '/api', this.authentication});

  /// Server base path; mutable so the app can switch endpoints at runtime.
  String basePath;

  final Authentication? authentication;

  var _client = Client();
  final _defaultHeaderMap = <String, String>{};

  /// The HTTP [Client] used for every request. Never null.
  Client get client => _client;

  /// Swaps in a new HTTP [Client] (e.g. a platform-native or mocked client).
  set client(Client newClient) {
    _client = newClient;
  }

  /// Headers applied to every request, in addition to per-call headers.
  Map<String, String> get defaultHeaderMap => _defaultHeaderMap;

  /// Registers a header sent with every subsequent request.
  void addDefaultHeader(String key, String value) {
    _defaultHeaderMap[key] = value;
  }

  /// Builds, authenticates, and sends a request, returning the full [Response].
  ///
  /// [queryParams] is a list (not a map) because a key may legitimately repeat
  /// under the `multi` collection format. [body] may be a JSON-encodable value,
  /// a [MultipartFile] (single-file upload), or a [MultipartRequest]. When
  /// [abortTrigger] completes the request is aborted with a
  /// [RequestAbortedException].
  Future<Response> invokeAPI(
    String path,
    String method,
    List<QueryParam> queryParams,
    Object? body,
    Map<String, String> headerParams,
    Map<String, String> formParams,
    String? contentType, {
    Future<void>? abortTrigger,
  }) async {
    await authentication?.applyToParams(queryParams, headerParams);

    headerParams.addAll(_defaultHeaderMap);
    if (contentType != null) {
      headerParams['Content-Type'] = contentType;
    }

    final urlEncodedQueryParams = queryParams.map((param) => '$param');
    final queryString = urlEncodedQueryParams.isNotEmpty ? '?${urlEncodedQueryParams.join('&')}' : '';
    final uri = Uri.parse('$basePath$path$queryString');

    try {
      // Single-file upload that is not itself a multipart/form-data body.
      if (body is MultipartFile &&
          (contentType == null || !contentType.toLowerCase().startsWith('multipart/form-data'))) {
        final request = AbortableStreamedRequest(method, uri, abortTrigger: abortTrigger);
        request.headers.addAll(headerParams);
        request.contentLength = body.length;
        body.finalize().listen(
          request.sink.add,
          onDone: request.sink.close,
          // ignore: avoid_types_on_closure_parameters
          onError: (Object error, StackTrace trace) => request.sink.close(),
          cancelOnError: true,
        );
        return Response.fromStream(await _client.send(request));
      }

      if (body is MultipartRequest) {
        final request = AbortableMultipartRequest(method, uri, abortTrigger: abortTrigger);
        request.fields.addAll(body.fields);
        request.files.addAll(body.files);
        request.headers.addAll(body.headers);
        request.headers.addAll(headerParams);
        return Response.fromStream(await _client.send(request));
      }

      final request = AbortableRequest(method, uri, abortTrigger: abortTrigger);
      request.headers.addAll(headerParams);
      if (contentType == 'application/x-www-form-urlencoded') {
        request.bodyFields = formParams;
      } else if (body != null) {
        request.body = await serializeAsync(body);
      }
      return Response.fromStream(await _client.send(request));
    } on RequestAbortedException {
      rethrow;
    } on SocketException catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'Socket operation failed: $method $path', error, trace);
    } on TlsException catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'TLS/SSL communication failed: $method $path', error, trace);
    } on IOException catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'I/O operation failed: $method $path', error, trace);
    } on ClientException catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'HTTP connection failed: $method $path', error, trace);
    } on Exception catch (error, trace) {
      throw ApiException.withInner(HttpStatus.badRequest, 'Exception occurred: $method $path', error, trace);
    }
  }

  /// Decodes a JSON [value] into an instance of [targetType].
  ///
  /// JSON parsing runs on a background isolate via [compute] so large payloads
  /// do not block the UI thread.
  Future<dynamic> deserializeAsync(String value, String targetType, {bool growable = false}) async {
    // Decode off the main isolate; the type-dispatch below is cheap.
    if (targetType == 'String') {
      return value;
    }
    final decoded = await compute(_decodeJson, value);
    return fromJson(decoded, targetType, growable: growable);
  }

  /// JSON-encodes [value], returning `''` for `null`.
  Future<String> serializeAsync(Object? value) async => value == null ? '' : json.encode(value);

  /// Returns a native instance of the OpenAPI class named by [targetType].
  ///
  /// Scalars are coerced inline; `List<X>` / `Set<X>` / `Map<String, X>` recurse
  /// on their element type; everything else dispatches to the generated
  /// [deserializeNamed] table over all model and enum names.
  static dynamic fromJson(dynamic value, String targetType, {bool growable = false}) {
    final type = targetType.replaceAll(' ', '');
    try {
      switch (type) {
        case 'String':
          return value is String ? value : value.toString();
        case 'int':
          return value is int ? value : int.parse('$value');
        case 'double':
          return value is double ? value : double.parse('$value');
        case 'num':
          return value is num ? value : num.parse('$value');
        case 'bool':
          if (value is bool) {
            return value;
          }
          final valueString = '$value'.toLowerCase();
          return valueString == 'true' || valueString == '1';
        case 'DateTime':
          return value is DateTime ? value : DateTime.tryParse('$value');
        default:
          // Collection wrappers recurse on the element type.
          dynamic match;
          if (value is List && (match = _regList.firstMatch(type)?.group(1)) != null) {
            return value.map<dynamic>((dynamic v) => fromJson(v, match, growable: growable)).toList(growable: growable);
          }
          if (value is Set && (match = _regSet.firstMatch(type)?.group(1)) != null) {
            return value.map<dynamic>((dynamic v) => fromJson(v, match, growable: growable)).toSet();
          }
          if (value is Map && (match = _regMap.firstMatch(type)?.group(1)) != null) {
            return Map<String, dynamic>.fromIterables(
              value.keys.cast<String>(),
              value.values.map<dynamic>((dynamic v) => fromJson(v, match, growable: growable)),
            );
          }
          // Named model / enum dispatch (generated; see deserializeNamed).
          final hit = deserializeNamed(value, type);
          if (hit != _noMatch) {
            return hit;
          }
      }
    } on Exception catch (error, trace) {
      throw ApiException.withInner(HttpStatus.internalServerError, 'Exception during deserialization.', error, trace);
    }
    throw ApiException(HttpStatus.internalServerError, 'Could not find a suitable class for deserialization');
  }
}

/// Decodes a JSON string; invoked inside [compute] on a background isolate.
dynamic _decodeJson(String value) => json.decode(value);

final _regList = RegExp(r'^List<(.*)>$');
final _regSet = RegExp(r'^Set<(.*)>$');
final _regMap = RegExp(r'^Map<String,(.*)>$');

/// Sentinel returned by [deserializeNamed] when [targetType] is not a known
/// model/enum name, so [ApiClient.fromJson] can fall through to its error path.
const Object _noMatch = Object();

// ───────────────────────────────────────────────────────────────────────────
// GENERATED DISPATCH — INJECTION POINT
//
// The integrator emits `deserializeNamed` as part of the generated client (a
// `part of openapi.api;` file). It must:
//   * `switch (targetType)` over EVERY model / enum / union / alias dartName;
//   * `return <Type>.fromJson(value);` for each case;
//   * `return _noMatch;` in the default branch (NOT throw) so collection and
//     error handling in `ApiClient.fromJson` stays centralized.
//
// Example body the generator should produce:
//
//   dynamic deserializeNamed(dynamic value, String targetType) {
//     switch (targetType) {
//       case 'ActivityCreateDto':
//         return ActivityCreateDto.fromJson(value);
//       // ... one case per declaration ...
//       default:
//         return _noMatch;
//     }
//   }
//
// TODO(integrator): replace this stub with the generated `deserializeNamed`.
// The stub below makes the runtime compile standalone; the generated version
// SHADOWS nothing — remove this stub when emitting the real one, or have the
// generator omit this stub file. It is kept here only so reviewers see the
// exact contract.
// ───────────────────────────────────────────────────────────────────────────
dynamic deserializeNamed(dynamic value, String targetType) => _noMatch;
