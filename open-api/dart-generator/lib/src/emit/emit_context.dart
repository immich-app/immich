/// Shared rendering context for every emitter.
///
/// Holds the [GeneratorOptions], a single configured [DartFormatter]
/// (page width 120), the per-file banner, and helpers to render a
/// `code_builder` [Spec] to formatted source and to write that source to disk.
library;

import 'dart:io';

import 'package:code_builder/code_builder.dart';
import 'package:dart_style/dart_style.dart';

import '../ir/types.dart';

/// The banner every emitted `part of` file begins with.
///
/// `api.dart` itself is the library file and uses `library openapi.api;`
/// instead of this `part of` directive, so it does not use [partBanner].
const String partBanner = '// AUTO-GENERATED FILE, DO NOT MODIFY!\n'
    '//\n'
    'part of openapi.api;';

/// Carries generator-wide configuration and shared rendering machinery.
class EmitContext {
  final GeneratorOptions options;
  final DartFormatter _formatter;

  EmitContext(this.options)
      : _formatter = DartFormatter(
          languageVersion: DartFormatter.latestLanguageVersion,
          pageWidth: 120,
        );

  /// Render a `code_builder` [spec] to formatted Dart source.
  ///
  /// Uses a scoped emitter so generated references format cleanly, then runs
  /// [DartFormatter] once over the whole unit. The result is deterministic.
  String render(Spec spec) {
    final emitter = DartEmitter.scoped(useNullSafetySyntax: true);
    final source = spec.accept(emitter).toString();
    return _formatter.format(source);
  }

  /// Render [spec] and prefix it with the `part of` [partBanner].
  ///
  /// The banner is prepended to the already-formatted body (it is a comment +
  /// directive that the formatter would otherwise normalize spacing around).
  String renderPart(Spec spec) => '$partBanner\n\n${render(spec)}';

  /// Format a raw Dart [source] string (no banner). For files assembled
  /// outside `code_builder`.
  String format(String source) => _formatter.format(source);

  /// Write [contents] to [path], creating parent directories as needed.
  void writeFile(String path, String contents) {
    final file = File(path);
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(contents);
  }
}
