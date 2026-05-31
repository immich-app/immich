/// Loads and indexes the Immich OpenAPI 3.0 spec.
///
/// This is the only module that touches the raw OpenAPI document. It decodes
/// the JSON, asserts the version is 3.0.x, and exposes a thin index over the
/// spec maps. Ref identity is PRESERVED: `$ref`s are never dereferenced or
/// inlined here. Downstream walkers resolve a `$ref` to its target schema by
/// name via [OpenApiSpec.schemaByName], so named types stay named.
library;

import 'dart:convert';
import 'dart:io';

import '../ir/types.dart';

/// Thrown when the spec file cannot be loaded or is not a supported OpenAPI
/// 3.0.x document.
class SpecLoadException implements Exception {
  final String message;
  const SpecLoadException(this.message);

  @override
  String toString() => 'SpecLoadException: $message';
}

/// An indexed view over a loaded OpenAPI 3.0.x document.
///
/// Holds the decoded root map and provides typed accessors for the parts the
/// generator consumes. All `$ref`s in the spec are local
/// (`#/components/schemas/Name`); use [refName] to extract a referent's name
/// and [schemaByName] to resolve it without inlining.
class OpenApiSpec {
  /// The decoded root document.
  final Map<String, dynamic> root;

  /// `components.schemas` — name → raw schema node. Empty when absent.
  final Map<String, dynamic> schemas;

  /// `paths` — path string → path-item node. Empty when absent.
  final Map<String, dynamic> paths;

  /// `components.securitySchemes` — name → scheme node. Empty when absent.
  final Map<String, dynamic> securitySchemes;

  /// Parsed `info` block plus the declared OpenAPI version.
  final DocInfo info;

  OpenApiSpec._({
    required this.root,
    required this.schemas,
    required this.paths,
    required this.securitySchemes,
    required this.info,
  });

  /// Load and decode the spec at [path], asserting OpenAPI 3.0.x.
  ///
  /// Throws [SpecLoadException] when the file is missing, not valid JSON, not
  /// a JSON object, or declares an unsupported `openapi` version.
  factory OpenApiSpec.load(String path) {
    final file = File(path);
    if (!file.existsSync()) {
      throw SpecLoadException('Spec file not found: $path');
    }
    final raw = file.readAsStringSync();
    return OpenApiSpec.parse(raw, sourcePath: path);
  }

  /// Parse an already-read spec [source]. [sourcePath] is used only in error
  /// messages. Useful for tests that supply the document inline.
  factory OpenApiSpec.parse(String source, {String sourcePath = '<memory>'}) {
    final Object? decoded;
    try {
      decoded = jsonDecode(source);
    } on FormatException catch (e) {
      throw SpecLoadException('Spec is not valid JSON ($sourcePath): ${e.message}');
    }
    if (decoded is! Map<String, dynamic>) {
      throw SpecLoadException('Spec root must be a JSON object ($sourcePath)');
    }

    final openApiVersion = decoded['openapi'];
    if (openApiVersion is! String) {
      throw SpecLoadException("Spec is missing a string 'openapi' version ($sourcePath)");
    }
    if (!openApiVersion.startsWith('3.0.')) {
      throw SpecLoadException(
        "Unsupported OpenAPI version '$openApiVersion' ($sourcePath); "
        'this generator targets 3.0.x',
      );
    }

    final components = _asMap(decoded['components']);

    final infoNode = _asMap(decoded['info']);
    final title = infoNode['title'];
    final version = infoNode['version'];
    final info = DocInfo(
      title: title is String ? title : 'OpenAPI',
      version: version is String ? version : '0.0.0',
      openApiVersion: openApiVersion,
    );

    return OpenApiSpec._(
      root: decoded,
      schemas: _asMap(components['schemas']),
      paths: _asMap(decoded['paths']),
      securitySchemes: _asMap(components['securitySchemes']),
      info: info,
    );
  }

  /// The last path segment of a local `$ref`, or null when [node] is not a
  /// `{$ref: '#/.../Name'}` reference object.
  ///
  /// `{$ref: '#/components/schemas/AssetResponseDto'}` → `'AssetResponseDto'`.
  static String? refName(Object? node) {
    if (node is! Map) return null;
    final ref = node[r'$ref'];
    if (ref is! String || ref.isEmpty) return null;
    final slash = ref.lastIndexOf('/');
    return slash < 0 ? ref : ref.substring(slash + 1);
  }

  /// The raw schema node for [name] in `components.schemas`.
  ///
  /// Throws [SpecLoadException] when no such schema exists — a dangling `$ref`
  /// is a spec defect the generator should fail loudly on.
  Map<String, dynamic> schemaByName(String name) {
    final node = schemas[name];
    if (node is! Map<String, dynamic>) {
      throw SpecLoadException("No schema named '$name' in components.schemas");
    }
    return node;
  }

  /// Whether a schema named [name] exists in `components.schemas`.
  bool hasSchema(String name) => schemas[name] is Map;

  static Map<String, dynamic> _asMap(Object? node) =>
      node is Map<String, dynamic> ? node : const <String, dynamic>{};
}
