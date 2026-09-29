// Intentionally NOT named `*_test.dart`: that suffix makes `flutter test`
// auto-discover it, which would run it on every mobile PR. This check is only
// relevant when the OpenAPI spec changes, so the `Check OpenAPI` workflow runs
// it by explicit path with the spec locations in the environment.

import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/openapi_patching.dart';

void main() {
  test('every newly-required response field has a backward-compat patch', () {
    final basePath = Platform.environment['OPENAPI_BASE_SPEC'];
    final revisionPath = Platform.environment['OPENAPI_REVISION_SPEC'];
    if (basePath == null || revisionPath == null) {
      markTestSkipped('set OPENAPI_BASE_SPEC and OPENAPI_REVISION_SPEC to run');
      return;
    }

    final baseRequired = _requiredBySchema(_loadSpec(basePath));
    final revisionSpec = _loadSpec(revisionPath);
    final revisionRequired = _requiredBySchema(revisionSpec);
    final deserialized = _deserializedSchemas(revisionSpec);
    final patched = openApiPatches.map(
      (type, fields) => MapEntry(type, fields.keys.toSet()),
    );

    final missing = <String>[];
    for (final entry in revisionRequired.entries) {
      if (!deserialized.contains(entry.key)) {
        continue;
      }

      // Skip new DTOs
      if (!baseRequired.containsKey(entry.key)) {
        continue;
      }

      final have = patched[entry.key] ?? const <String>{};
      final newlyRequired = entry.value.difference(
        baseRequired[entry.key] ?? const <String>{},
      );
      for (final field in newlyRequired) {
        if (!have.contains(field)) {
          missing.add('${entry.key}.$field');
        }
      }
    }
    missing.sort();

    expect(
      missing,
      isEmpty,
      reason:
          'Detected a breaking change: $missing\n'
          'Either add a default to openApiPatches in lib/utils/openapi_patching.dart, or make it optional',
    );
  });
}

Map<String, dynamic> _loadSpec(String path) =>
    jsonDecode(File(path).readAsStringSync()) as Map<String, dynamic>;

Map<String, dynamic> _schemas(Map<String, dynamic> spec) =>
    ((spec['components'] as Map?)?['schemas'] as Map?)
        ?.cast<String, dynamic>() ??
    const {};

Map<String, Set<String>> _requiredBySchema(Map<String, dynamic> spec) {
  final result = <String, Set<String>>{};
  _schemas(spec).forEach((name, schema) {
    final required = (schema as Map)['required'] as List? ?? const [];
    result[name] = required.cast<String>().toSet();
  });
  return result;
}

Iterable<String> _refsIn(Object? node) sync* {
  if (node is Map) {
    if (node[r'$ref'] case final String ref) {
      yield ref.split('/').last;
    }
    for (final value in node.values) {
      yield* _refsIn(value);
    }
  } else if (node is List) {
    for (final value in node) {
      yield* _refsIn(value);
    }
  }
}

Set<String> _deserializedSchemas(Map<String, dynamic> spec) {
  final schemas = _schemas(spec);
  final reachable = <String>{};

  final queue = <String>[];
  for (final path in (spec['paths'] as Map?)?.values ?? const []) {
    if (path is! Map) {
      continue;
    }
    for (final operation in path.values) {
      if (operation is Map) {
        queue.addAll(_refsIn(operation['responses']));
      }
    }
  }
  while (queue.isNotEmpty) {
    final name = queue.removeLast();
    if (!schemas.containsKey(name) || !reachable.add(name)) {
      continue;
    }
    queue.addAll(_refsIn(schemas[name]));
  }
  return reachable;
}
