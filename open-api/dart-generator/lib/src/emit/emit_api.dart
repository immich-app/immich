/// Emits an [ApiModel] as a Dart `<Tag>Api` class (DESIGN §5.5, idiomatic).
///
/// Each operation yields TWO methods:
///
///   * `<name>WithHttpInfo(...) → Future<Response>` — the low-level form that
///     builds the request (path, query, headers, body) and delegates to
///     `apiClient.invokeAPI(...)`.
///   * `<name>(...) → Future<T>` — the high-level form that calls the
///     `WithHttpInfo` variant, throws [ApiException] on a >= 400 status, and
///     decodes the success body.
///
/// Idiomatic decisions applied here (overriding the doc's parity framing):
///
///   * High-level success returns are NON-NULL (`Future<T>`) when
///     [GeneratorOptions.nonNullReturns] is set — the body is force-decoded.
///   * 204 / no-content operations return `Future<void>`.
///   * octet-stream downloads return `Future<Uint8List>`; the streaming
///     download case (raw bytes via a binary download response) returns the
///     decoded bytes.
///   * An `abortTrigger` named parameter is threaded through every operation
///     (when [GeneratorOptions.emitAbortTrigger]) and forwarded to `invokeAPI`.
///
/// Method bodies are raw [Code] strings: `code_builder` does not model
/// statements, so the request-building logic is emitted as formatted source.
library;

import 'package:code_builder/code_builder.dart';

import '../ir/types.dart';
import 'dart_types.dart';
import 'emit_meta.dart';

/// Builds the `<Tag>Api` class for [api].
///
/// Assumes name resolution has run: [ApiModel.dartName], every operation's
/// `dartName`, and every param/type `dartName` are populated.
Class emitApi(ApiModel api, GeneratorOptions options) {
  final methods = <Method>[];
  for (final op in api.operations) {
    methods.add(_withHttpInfo(op, options));
    methods.add(_highLevel(op, options));
  }

  return Class(
    (b) => b
      ..name = api.dartName
      ..constructors.add(
        Constructor(
          (c) => c
            ..optionalParameters.add(
              Parameter((p) => p..name = 'apiClient'..type = refer('ApiClient?')),
            )
            ..initializers.add(const Code('apiClient = apiClient ?? defaultApiClient')),
        ),
      )
      ..fields.addAll([
        Field((f) => f..name = 'apiClient'..type = refer('ApiClient')..modifier = FieldModifier.final$),
        // Inlined per-operation server-version metadata, namespaced by
        // operation name (e.g. `getActivitiesAddedIn`).
        for (final op in api.operations) ...operationVersionFields(op),
      ])
      ..methods.addAll(methods),
  );
}

// ───────────────────────────── low-level form ──────────────────────────────

Method _withHttpInfo(OperationModel op, GeneratorOptions options) {
  final params = _signatureParams(op, options, optionalSuffix: false);
  return Method(
    (b) => b
      ..name = '${op.dartName}WithHttpInfo'
      ..docs.addAll(_opDocs(op, withHttpInfo: true))
      ..annotations.addAll(_deprecation(op))
      ..modifier = MethodModifier.async
      ..returns = refer('Future<Response>')
      ..requiredParameters.addAll(params.positional)
      ..optionalParameters.addAll(params.named)
      ..body = Code(_withHttpInfoBody(op, options)),
  );
}

String _withHttpInfoBody(OperationModel op, GeneratorOptions options) {
  final buf = StringBuffer();

  // Path with path-param substitution.
  buf.writeln(_pathExpr(op));
  buf.writeln();

  // postBody (json / urlencoded set later; multipart sets it at the end).
  final body = op.body?.content;
  if (body is JsonBody) {
    buf.writeln('Object? postBody = ${_jsonBodyArg(op)};');
  } else {
    buf.writeln('Object? postBody;');
  }
  buf.writeln();

  buf.writeln('final queryParams = <QueryParam>[];');
  buf.writeln('final headerParams = <String, String>{};');
  buf.writeln('final formParams = <String, String>{};');
  buf.writeln();

  // Query params.
  for (final q in op.queryParams) {
    buf.writeln(_queryParamStmt(q));
  }
  if (op.queryParams.isNotEmpty) buf.writeln();

  // Header params.
  for (final h in op.headerParams) {
    buf.writeln(_headerParamStmt(h));
  }
  if (op.headerParams.isNotEmpty) buf.writeln();

  // Body content-type + multipart / urlencoded assembly.
  buf.writeln('const contentTypes = <String>[${_contentTypes(op)}];');
  buf.writeln();
  if (body is MultipartBody) {
    buf.write(_multipartAssembly(op, body));
    buf.writeln();
  } else if (body is UrlEncodedBody) {
    buf.write(_urlEncodedAssembly(op, body));
    buf.writeln();
  }

  // invokeAPI.
  final abort = options.emitAbortTrigger ? '\n  abortTrigger: abortTrigger,' : '';
  buf.write('''
return apiClient.invokeAPI(
  apiPath,
  ${_methodLiteral(op.httpMethod)},
  queryParams,
  postBody,
  headerParams,
  formParams,
  contentTypes.isEmpty ? null : contentTypes.first,$abort
);''');

  return buf.toString();
}

String _pathExpr(OperationModel op) {
  final raw = "r'${op.path}'";
  if (op.pathParams.isEmpty) {
    return 'final apiPath = $raw;';
  }
  final buf = StringBuffer('final apiPath = $raw');
  for (final p in op.pathParams) {
    buf.write("\n  .replaceAll('{${p.wireName}}', ${_pathParamToString(p)})");
  }
  buf.write(';');
  return buf.toString();
}

String _pathParamToString(Param p) {
  // Path params are required; string types pass through, others stringify.
  final t = p.type;
  if (t is PrimitiveType && t.primitive == PrimitiveKind.string) {
    return p.dartName;
  }
  return 'parameterToString(${p.dartName})';
}

String _jsonBodyArg(OperationModel op) {
  // The single JSON body param is named after its DTO type (camelCase),
  // matching the param synthesized in [_bodyParam].
  return _bodyParamName(op);
}

String _queryParamStmt(Param p) {
  final cf = _collectionFormat(p);
  final call = "queryParams.addAll(_queryParams('$cf', '${p.wireName}', ${p.dartName}));";
  // Always guard: query params are optional on the wire even when the spec
  // marks them required, and a null guard keeps omission behavior uniform.
  if (p.required && !p.nullable) {
    return call;
  }
  return 'if (${p.dartName} != null) {\n  $call\n}';
}

String _collectionFormat(Param p) {
  // Only array-valued params carry a meaningful collection format.
  if (p.type is! ArrayType) return '';
  return switch (p.style) {
    ParamStyle.form => p.explode ? 'multi' : 'csv',
    ParamStyle.spaceDelimited => 'ssv',
    ParamStyle.pipeDelimited => 'pipes',
  };
}

String _headerParamStmt(Param p) {
  final assign = "headerParams[r'${p.wireName}'] = parameterToString(${p.dartName});";
  if (p.required && !p.nullable) {
    return assign;
  }
  return 'if (${p.dartName} != null) {\n  $assign\n}';
}

String _contentTypes(OperationModel op) {
  final body = op.body?.content;
  return switch (body) {
    JsonBody() => "r'application/json'",
    MultipartBody() => "r'multipart/form-data'",
    UrlEncodedBody() => "r'application/x-www-form-urlencoded'",
    null => '',
  };
}

String _multipartAssembly(OperationModel op, MultipartBody body) {
  final buf = StringBuffer();
  buf.writeln('bool hasFields = false;');
  buf.writeln("final mp = MultipartRequest('${_methodRaw(op.httpMethod)}', Uri.parse(apiPath));");
  for (final part in body.parts) {
    final name = _partDartName(part);
    final inner = StringBuffer();
    inner.writeln('hasFields = true;');
    if (part.isFile) {
      inner.writeln("mp.fields[r'${part.wireName}'] = $name.field;");
      inner.write('mp.files.add($name);');
    } else {
      inner.write("mp.fields[r'${part.wireName}'] = parameterToString($name);");
    }
    if (part.required) {
      buf.writeln(inner.toString());
    } else {
      buf.writeln('if ($name != null) {');
      buf.writeln(inner.toString());
      buf.writeln('}');
    }
  }
  buf.writeln('if (hasFields) {');
  buf.writeln('  postBody = mp;');
  buf.writeln('}');
  return buf.toString();
}

String _urlEncodedAssembly(OperationModel op, UrlEncodedBody body) {
  // The DTO is serialized field-by-field into formParams by the caller via its
  // toJson; we pass the DTO through and let invokeAPI encode formParams. For the
  // current spec no urlencoded body exists, so emit a passthrough that flattens
  // the DTO's toJson map into string form params.
  final name = _bodyParamName(op);
  return '''
$name.toJson().forEach((k, v) {
  if (v != null) {
    formParams[k] = parameterToString(v);
  }
});''';
}

// ───────────────────────────── high-level form ─────────────────────────────

Method _highLevel(OperationModel op, GeneratorOptions options) {
  final params = _signatureParams(op, options, optionalSuffix: false);
  final ret = _returnType(op, options);
  return Method(
    (b) => b
      ..name = op.dartName
      ..docs.addAll(_opDocs(op, withHttpInfo: false))
      ..annotations.addAll(_deprecation(op))
      ..modifier = MethodModifier.async
      ..returns = refer(ret.future)
      ..requiredParameters.addAll(params.positional)
      ..optionalParameters.addAll(params.named)
      ..body = Code(_highLevelBody(op, options, ret)),
  );
}

class _Return {
  final String future; // e.g. Future<AssetResponseDto>, Future<void>
  final String? decodeType; // null ⇒ void; type name for deserializeAsync
  final bool isList;
  final String? listElement;
  final bool isBytes;
  const _Return({
    required this.future,
    this.decodeType,
    this.isList = false,
    this.listElement,
    this.isBytes = false,
  });
}

_Return _returnType(OperationModel op, GeneratorOptions options) {
  final resp = op.successResponse;
  final t = resp.type;

  // No body / 204 → void.
  if (t == null) {
    return const _Return(future: 'Future<void>');
  }

  // Binary / octet-stream download → bytes.
  if (t is BinaryType && t.role == BinaryRole.download) {
    return const _Return(future: 'Future<Uint8List>', isBytes: true);
  }
  if (resp.contentType == ResponseContentType.octetStream) {
    return const _Return(future: 'Future<Uint8List>', isBytes: true);
  }

  // Inline list response.
  if (t is ArrayType) {
    final element = dartType(t.items, nullable: t.itemsNullable);
    final collection = t.unique ? 'Set<$element>' : 'List<$element>';
    return _Return(
      future: 'Future<$collection>',
      decodeType: collection,
      isList: true,
      listElement: element,
    );
  }

  final bare = dartType(t, nullable: false);
  return _Return(future: 'Future<$bare>', decodeType: _wireTypeName(t));
}

/// The `targetType` string passed to `deserializeAsync` — the Dart type name
/// used by the runtime `fromJson` type-switch.
String _wireTypeName(TypeModel t) => dartType(t, nullable: false);

String _highLevelBody(OperationModel op, GeneratorOptions options, _Return ret) {
  final buf = StringBuffer();
  final args = _forwardArgs(op, options);
  buf.writeln('final response = await ${op.dartName}WithHttpInfo($args);');
  buf.writeln('if (response.statusCode >= HttpStatus.badRequest) {');
  buf.writeln('  throw ApiException(response.statusCode, await _decodeBodyBytes(response));');
  buf.writeln('}');

  if (ret.future == 'Future<void>') {
    return buf.toString().trimRight();
  }

  if (ret.isBytes) {
    // Raw binary body: the http.Response exposes the undecoded bytes directly.
    buf.writeln('return response.bodyBytes;');
    return buf.toString().trimRight();
  }

  // Decode the success body. Non-null returns force-unwrap the decoded value.
  final guard = '''
if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {''';
  buf.writeln(guard);
  if (ret.isList) {
    buf.writeln('  final responseBody = await _decodeBodyBytes(response);');
    final decoded = "await apiClient.deserializeAsync(responseBody, r'${ret.decodeType}') as List";
    if (ret.future.startsWith('Future<Set<')) {
      buf.writeln('  return ($decoded)');
      buf.writeln('    .cast<${ret.listElement}>()');
      buf.writeln('    .toSet();');
    } else {
      buf.writeln('  return ($decoded)');
      buf.writeln('    .cast<${ret.listElement}>()');
      buf.writeln('    .toList(growable: false);');
    }
  } else {
    final bare = ret.future.substring('Future<'.length, ret.future.length - 1);
    buf.writeln(
      "  return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'${ret.decodeType}') as $bare;",
    );
  }
  buf.writeln('}');

  // Non-null contract: a missing body for a declared success type is an error.
  if (options.nonNullReturns) {
    buf.writeln('throw ApiException(response.statusCode, r\'Unexpected empty response body\');');
  } else {
    buf.writeln('return null;');
  }
  return buf.toString().trimRight();
}

/// The argument list forwarded from the high-level method to `WithHttpInfo`.
String _forwardArgs(OperationModel op, GeneratorOptions options) {
  final positional = <String>[for (final p in op.pathParams) p.dartName];
  final named = <String>[];
  for (final p in op.queryParams) {
    named.add('${p.dartName}: ${p.dartName}');
  }
  for (final h in op.headerParams) {
    named.add('${h.dartName}: ${h.dartName}');
  }
  final bodyNames = _bodyForwardNames(op);
  for (final n in bodyNames.positional) {
    positional.add(n);
  }
  for (final n in bodyNames.named) {
    named.add('$n: $n');
  }
  if (options.emitAbortTrigger) {
    named.add('abortTrigger: abortTrigger');
  }
  final parts = [...positional, ...named];
  return parts.join(', ');
}

// ───────────────────────────── parameters ──────────────────────────────────

class _Params {
  final List<Parameter> positional;
  final List<Parameter> named;
  const _Params(this.positional, this.named);
}

/// The signature: required positional path params + a brace block of
/// query/header/body optionals plus `abortTrigger`. JSON/urlencoded bodies and
/// required multipart parts are emitted as REQUIRED positional params.
_Params _signatureParams(OperationModel op, GeneratorOptions options, {required bool optionalSuffix}) {
  final positional = <Parameter>[];
  final named = <Parameter>[];

  // Path params (always required positional).
  for (final p in op.pathParams) {
    positional.add(Parameter((b) => b..name = p.dartName..type = refer(_paramType(p))));
  }

  // Body params.
  final body = op.body?.content;
  if (body is JsonBody) {
    final required = op.body!.required;
    final type = dartType(body.type, nullable: !required);
    if (required) {
      positional.add(Parameter((b) => b..name = _bodyParamName(op)..type = refer(type)));
    } else {
      named.add(Parameter((b) => b..name = _bodyParamName(op)..type = refer(type)..named = true));
    }
  } else if (body is UrlEncodedBody) {
    final required = op.body!.required;
    final type = dartType(body.type, nullable: !required);
    if (required) {
      positional.add(Parameter((b) => b..name = _bodyParamName(op)..type = refer(type)));
    } else {
      named.add(Parameter((b) => b..name = _bodyParamName(op)..type = refer(type)..named = true));
    }
  } else if (body is MultipartBody) {
    for (final part in body.parts) {
      final name = _partDartName(part);
      final type = dartType(part.type, nullable: !part.required);
      if (part.required) {
        positional.add(Parameter((b) => b..name = name..type = refer(type)));
      } else {
        named.add(Parameter((b) => b..name = name..type = refer(type)..named = true));
      }
    }
  }

  // Query params (named, optional unless required-non-null).
  for (final p in op.queryParams) {
    named.add(
      Parameter(
        (b) => b
          ..name = p.dartName
          ..type = refer(_paramType(p))
          ..named = true
          ..required = p.required && !p.nullable,
      ),
    );
  }

  // Header params (named).
  for (final h in op.headerParams) {
    named.add(
      Parameter(
        (b) => b
          ..name = h.dartName
          ..type = refer(_paramType(h))
          ..named = true
          ..required = h.required && !h.nullable,
      ),
    );
  }

  // abortTrigger — always present in the brace block when enabled.
  if (options.emitAbortTrigger) {
    named.add(
      Parameter((b) => b..name = 'abortTrigger'..type = refer('Future<void>?')..named = true),
    );
  }

  return _Params(positional, named);
}

/// Param type: optional/nullable params surface as `T?`.
String _paramType(Param p) {
  final nullable = !(p.required && !p.nullable);
  return dartType(p.type, nullable: nullable);
}

class _BodyNames {
  final List<String> positional;
  final List<String> named;
  const _BodyNames(this.positional, this.named);
}

_BodyNames _bodyForwardNames(OperationModel op) {
  final body = op.body?.content;
  if (body == null) return const _BodyNames([], []);
  switch (body) {
    case JsonBody():
    case UrlEncodedBody():
      final name = _bodyParamName(op);
      return op.body!.required ? _BodyNames([name], const []) : _BodyNames(const [], [name]);
    case MultipartBody():
      final pos = <String>[];
      final nm = <String>[];
      for (final part in body.parts) {
        final name = _partDartName(part);
        if (part.required) {
          pos.add(name);
        } else {
          nm.add(name);
        }
      }
      return _BodyNames(pos, nm);
  }
}

/// The camelCase param name for a JSON/urlencoded body DTO.
String _bodyParamName(OperationModel op) {
  final body = op.body?.content;
  final typeName = switch (body) {
    JsonBody(:final type) => dartType(type, nullable: false),
    UrlEncodedBody(:final type) => dartType(type, nullable: false),
    _ => 'body',
  };
  return _lowerFirst(typeName);
}

/// Multipart part Dart param name — the part's own dartName when resolved,
/// else a camelCased wire name.
String _partDartName(MultipartPart part) => _lowerFirst(_pascalFromWire(part.wireName));

String _lowerFirst(String s) => s.isEmpty ? s : s[0].toLowerCase() + s.substring(1);

String _pascalFromWire(String wire) {
  // Wire field names are already camelCase identifiers in this spec; preserve.
  return wire;
}

// ───────────────────────────── misc emit helpers ───────────────────────────

String _methodLiteral(HttpMethod m) => "r'${_methodRaw(m)}'";

String _methodRaw(HttpMethod m) => switch (m) {
      HttpMethod.get => 'GET',
      HttpMethod.post => 'POST',
      HttpMethod.put => 'PUT',
      HttpMethod.patch => 'PATCH',
      HttpMethod.delete => 'DELETE',
    };

List<Expression> _deprecation(OperationModel op) {
  final message = deprecationMessage(op.versionMeta, specDeprecated: op.deprecated);
  if (message == null) return const [];
  return [refer('Deprecated').call([literalString(message)])];
}

List<String> _opDocs(OperationModel op, {required bool withHttpInfo}) {
  final lines = <String>[];
  final summary = op.summary?.trim();
  final description = op.description?.trim();
  if (summary != null && summary.isNotEmpty) {
    lines.add(summary);
  }
  if (description != null && description.isNotEmpty && description != summary) {
    if (lines.isNotEmpty) lines.add('');
    lines.addAll(description.split('\n').map((l) => l.trimRight()));
  }
  for (final line in sinceDocLines(op.versionMeta)) {
    if (lines.isNotEmpty) lines.add('');
    lines.add(line);
  }
  if (withHttpInfo) {
    if (lines.isNotEmpty) lines.add('');
    lines.add('Note: This method returns the HTTP [Response].');
  }
  return lines.map((l) => l.isEmpty ? '///' : '/// $l').toList(growable: false);
}
