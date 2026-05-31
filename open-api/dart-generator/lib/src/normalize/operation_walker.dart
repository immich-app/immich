/// Turns OpenAPI path items into IR [OperationModel]s grouped into [ApiModel]s
/// by tag (DESIGN §5.5).
///
/// Per operation it resolves:
///   * path / query / header parameters (style/explode default to form/true);
///   * request body (json / multipart / urlencoded; multipart parts carry
///     `isFile` for `format: binary` fields);
///   * responses (the success response, inline-array synthesis, 204 → void,
///     octet-stream → [BinaryType] download);
///   * security requirements, `deprecated`, summary/description;
///   * `x-immich-permission`, `x-immich-admin-only`, and version metadata via
///     [buildVersionMeta].
library;

import '../ir/types.dart';
import '../loader/spec.dart';
import '../util/version.dart';
import 'schema_walker.dart';

const _httpMethods = <String, HttpMethod>{
  'get': HttpMethod.get,
  'post': HttpMethod.post,
  'put': HttpMethod.put,
  'patch': HttpMethod.patch,
  'delete': HttpMethod.delete,
};

const _paramStyles = <String, ParamStyle>{
  'form': ParamStyle.form,
  'spaceDelimited': ParamStyle.spaceDelimited,
  'pipeDelimited': ParamStyle.pipeDelimited,
};

/// Walks `paths` into tag-grouped [ApiModel]s.
class OperationWalker {
  final OpenApiSpec spec;
  final SchemaWalker schemas;

  OperationWalker(this.spec, this.schemas);

  /// All operations grouped by their first tag, alphabetically by tag.
  ///
  /// Operations within an API keep spec order (stable, since the spec is an
  /// ordered map). Inline `type: array` response bodies stay [ArrayType] on the
  /// response and are materialized as a list at the operation site by the API
  /// emitter — no synthetic named declaration is created.
  List<ApiModel> walk() {
    final byTag = <String, List<OperationModel>>{};

    for (final pathEntry in spec.paths.entries) {
      final path = pathEntry.key;
      final item = pathEntry.value;
      if (item is! Map<String, dynamic>) continue;

      for (final methodEntry in item.entries) {
        final method = _httpMethods[methodEntry.key.toLowerCase()];
        if (method == null) continue;
        final op = methodEntry.value;
        if (op is! Map<String, dynamic>) continue;

        final operation = _operation(path, method, op);
        final tag = _tagOf(op);
        byTag.putIfAbsent(tag, () => []).add(operation);
      }
    }

    final tags = byTag.keys.toList()..sort();
    return [
      for (final tag in tags) ApiModel(tag: tag, operations: byTag[tag]!),
    ];
  }

  String _tagOf(Map<String, dynamic> op) {
    final tags = op['tags'];
    if (tags is List && tags.isNotEmpty && tags.first is String) {
      return tags.first as String;
    }
    return 'Default';
  }

  OperationModel _operation(String path, HttpMethod method, Map<String, dynamic> op) {
    final params = _params(op['parameters']);
    final responses = _responses(op['responses']);
    return OperationModel(
      operationId: op['operationId'] is String ? op['operationId'] as String : '$method$path',
      httpMethod: method,
      path: path,
      deprecated: op['deprecated'] == true,
      description: op['description'] is String ? op['description'] as String : null,
      summary: op['summary'] is String ? op['summary'] as String : null,
      pathParams: params.where((p) => p.$2 == 'path').map((p) => p.$1).toList(),
      queryParams: params.where((p) => p.$2 == 'query').map((p) => p.$1).toList(),
      headerParams: params.where((p) => p.$2 == 'header').map((p) => p.$1).toList(),
      body: _requestBody(op['requestBody']),
      responses: responses,
      successResponse: _successOf(responses),
      security: _security(op['security']),
      versionMeta: buildVersionMeta(op['x-immich-history'], op['x-immich-state']),
    );
  }

  // ───────────────────────────── parameters ───────────────────────────────

  /// Returns `(param, location)` pairs preserving spec order.
  List<(Param, String)> _params(Object? raw) {
    if (raw is! List) return const [];
    final result = <(Param, String)>[];
    for (final p in raw) {
      if (p is! Map<String, dynamic>) continue;
      final location = p['in'];
      if (location is! String) continue;
      final schema = p['schema'];
      final node = schema is Map<String, dynamic> ? schema : const <String, dynamic>{};
      final type = schemas.walkType(node);
      result.add((
        Param(
          wireName: p['name'] is String ? p['name'] as String : '',
          type: type,
          required: location == 'path' || p['required'] == true,
          nullable: node['nullable'] == true,
          defaultValue: _paramDefault(node, type),
          description: p['description'] is String ? p['description'] as String : null,
          style: _paramStyles[p['style']] ?? ParamStyle.form,
          explode: p['explode'] is bool ? p['explode'] as bool : true,
        ),
        location,
      ));
    }
    return result;
  }

  DefaultValue? _paramDefault(Map<String, dynamic> node, TypeModel type) {
    if (!node.containsKey('default')) return null;
    final raw = node['default'];
    if (raw == null) return const NullDefault();
    if (type is RefType && (raw is String || raw is int)) {
      return EnumDefault(type, raw as Object);
    }
    return switch (raw) {
      final bool b => BoolDefault(b),
      final num n => NumberDefault(n),
      final String s => StringDefault(s),
      _ => null,
    };
  }

  // ───────────────────────────── request body ─────────────────────────────

  RequestBody? _requestBody(Object? raw) {
    if (raw is! Map<String, dynamic>) return null;
    final content = raw['content'];
    if (content is! Map<String, dynamic> || content.isEmpty) return null;
    final required = raw['required'] == true;

    if (content['application/json'] case final Map<String, dynamic> json) {
      return RequestBody(required: required, content: JsonBody(_schemaType(json['schema'])));
    }
    if (content['multipart/form-data'] case final Map<String, dynamic> mp) {
      return RequestBody(required: required, content: _multipart(mp['schema']));
    }
    if (content['application/x-www-form-urlencoded'] case final Map<String, dynamic> ue) {
      return RequestBody(required: required, content: UrlEncodedBody(_schemaType(ue['schema'])));
    }
    // Unknown media type: model the first as JSON so emitters still see a body.
    final first = content.values.first;
    final schema = first is Map<String, dynamic> ? first['schema'] : null;
    return RequestBody(required: required, content: JsonBody(_schemaType(schema)));
  }

  /// A multipart body references a DTO whose properties become the form parts.
  /// Binary (`format: binary`) parts are flagged `isFile`.
  MultipartBody _multipart(Object? schemaNode) {
    final refName = OpenApiSpec.refName(schemaNode);
    final parts = <MultipartPart>[];

    if (refName != null && spec.hasSchema(refName)) {
      final dto = spec.schemaByName(refName);
      final required = (dto['required'] as List?)?.cast<String>().toSet() ?? const <String>{};
      final props = dto['properties'];
      if (props is Map<String, dynamic>) {
        for (final entry in props.entries) {
          final p = entry.value;
          if (p is! Map<String, dynamic>) continue;
          final type = schemas.walkType(p);
          parts.add(MultipartPart(
            wireName: entry.key,
            type: type,
            required: required.contains(entry.key),
            isFile: type is BinaryType,
          ));
        }
      }
    }
    return MultipartBody(RefType(refName ?? 'Object'), parts);
  }

  // ───────────────────────────── responses ────────────────────────────────

  List<ResponseModel> _responses(Object? raw) {
    if (raw is! Map<String, dynamic>) return const [];
    final result = <ResponseModel>[];
    for (final entry in raw.entries) {
      final code = int.tryParse(entry.key);
      if (code == null) continue;
      final node = entry.value;
      result.add(_response(code, node is Map<String, dynamic> ? node : const {}));
    }
    result.sort((a, b) => a.statusCode.compareTo(b.statusCode));
    return result;
  }

  ResponseModel _response(int code, Map<String, dynamic> node) {
    final content = node['content'];
    if (code == 204 || content is! Map<String, dynamic> || content.isEmpty) {
      return ResponseModel(statusCode: code);
    }
    if (content['application/octet-stream'] != null) {
      return ResponseModel(
        statusCode: code,
        type: BinaryType(BinaryRole.download),
        contentType: ResponseContentType.octetStream,
      );
    }
    if (content['application/json'] case final Map<String, dynamic> json) {
      return ResponseModel(
        statusCode: code,
        type: _schemaType(json['schema']),
        contentType: ResponseContentType.json,
      );
    }
    // Other media types with a body → treat as bytes download.
    return ResponseModel(
      statusCode: code,
      type: BinaryType(BinaryRole.download),
      contentType: ResponseContentType.octetStream,
    );
  }

  /// The success response: the lowest 2xx, else the first response.
  ResponseModel _successOf(List<ResponseModel> responses) {
    for (final r in responses) {
      if (r.statusCode >= 200 && r.statusCode < 300) return r;
    }
    return responses.isNotEmpty ? responses.first : const ResponseModel(statusCode: 200);
  }

  // ───────────────────────────── security ─────────────────────────────────

  List<SecurityRequirement> _security(Object? raw) {
    if (raw is! List) return const [];
    final result = <SecurityRequirement>[];
    for (final entry in raw) {
      if (entry is! Map<String, dynamic>) continue;
      for (final scheme in entry.entries) {
        final scopes = scheme.value is List ? (scheme.value as List).cast<String>() : const <String>[];
        result.add(SecurityRequirement(schemeName: scheme.key, scopes: scopes));
      }
    }
    return result;
  }

  TypeModel _schemaType(Object? schema) =>
      schema is Map<String, dynamic> ? schemas.walkType(schema) : FreeFormType();
}
