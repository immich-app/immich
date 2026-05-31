/// Emits the umbrella library file `api.dart`.
///
/// `api.dart` is the only non-`part of` file: it declares `library openapi.api;`,
/// holds every shared import, stitches the whole client together with `part`
/// directives (runtime + auth + models + enums + unions + aliases + apis +
/// meta), and defines the process-wide `defaultApiClient`.
///
/// Part directives are emitted in stable, grouped, alphabetically-sorted order
/// so the output is byte-deterministic across runs.
library;

import '../ir/types.dart';

/// Relative paths (without the `part '...';` wrapper) of the static runtime
/// files copied verbatim into the output, excluding the auth subtree.
///
/// These are the file stems the runtime agent ships under `lib/`. Kept here as
/// the single alignment point between this emitter and the runtime files; if
/// the runtime agent renames a file, update this list.
const List<String> kRuntimeParts = <String>[
  'api_client.dart',
  'api_compat.dart',
  'api_exception.dart',
  'api_helper.dart',
  'api_state.dart',
  'api_version.dart',
  'optional.dart',
];

/// Relative paths of the static auth runtime files (under `lib/auth/`).
const List<String> kAuthParts = <String>[
  'auth/api_key_auth.dart',
  'auth/authentication.dart',
  'auth/http_bearer_auth.dart',
  'auth/oauth.dart',
];

/// The shared imports every `part` relies on. Order matches `dart format`'s
/// canonical grouping (dart: then package:, each alphabetized).
const List<String> _baseDartImports = <String>[
  'dart:async',
  'dart:convert',
  'dart:io',
  'dart:typed_data',
];

const List<String> _basePackageImports = <String>[
  'package:collection/collection.dart',
  'package:flutter/foundation.dart',
  'package:http/http.dart',
  'package:meta/meta.dart',
];

/// Emits the umbrella `api.dart` source.
class LibraryEmitter {
  final GeneratorOptions options;

  const LibraryEmitter(this.options);

  /// Render the complete `api.dart` source for [doc]. Version metadata is
  /// inlined into each declaration/`*Api` class, so there are no separate meta
  /// part files.
  String render(IrDocument doc) {
    final buffer = StringBuffer();

    buffer.writeln('// AUTO-GENERATED FILE, DO NOT MODIFY!');
    buffer.writeln('//');
    buffer.writeln('// ignore_for_file: unused_element, unused_import');
    buffer.writeln('// ignore_for_file: always_put_required_named_parameters_first');
    buffer.writeln('// ignore_for_file: constant_identifier_names');
    buffer.writeln('// ignore_for_file: lines_longer_than_80_chars');
    buffer.writeln();
    buffer.writeln('library openapi.api;');
    buffer.writeln();

    for (final import in _imports()) {
      buffer.writeln("import '$import';");
    }
    buffer.writeln();

    for (final part in _partPaths(doc)) {
      buffer.writeln("part '$part';");
    }
    buffer.writeln();

    buffer.writeln('/// The process-wide default [ApiClient]; every `XxxApi()` uses it when');
    buffer.writeln('/// constructed without an explicit client.');
    buffer.writeln('final defaultApiClient = ApiClient();');

    return buffer.toString();
  }

  /// The full, ordered import list (dart: + package:).
  ///
  /// The client is fully self-contained — the backward-compat hook is the
  /// in-library `ApiCompat` and three-state fields use the in-library
  /// `Optional`, so there is NO import back into the host app.
  List<String> _imports() {
    final imports = <String>[..._baseDartImports, ..._basePackageImports];
    imports.sort(_importOrder);
    return imports;
  }

  /// `dart:` imports sort before `package:`; otherwise lexical.
  int _importOrder(String a, String b) {
    final aDart = a.startsWith('dart:');
    final bDart = b.startsWith('dart:');
    if (aDart != bDart) return aDart ? -1 : 1;
    return a.compareTo(b);
  }

  /// Every `part` path, grouped (runtime, auth, model, api) and sorted within
  /// each group for determinism.
  List<String> _partPaths(IrDocument doc) {
    final runtime = [...kRuntimeParts]..sort();
    final auth = [...kAuthParts]..sort();

    // Declarations (models/enums/unions/aliases) live under model/; version
    // metadata is inlined into each, so there are no separate meta files.
    final modelStems = <String>{};
    for (final decl in doc.declarations) {
      modelStems.add(decl.meta.fileName);
    }
    final models = modelStems.map((s) => 'model/$s.dart').toList()..sort();

    final apis = doc.apis.map((a) => 'api/${a.fileName}.dart').toList()..sort();

    return [...runtime, ...auth, ...models, ...apis];
  }
}
