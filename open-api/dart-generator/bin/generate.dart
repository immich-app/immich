/// CLI entry point for the Immich Dart OpenAPI generator.
///
/// Wires the full pipeline:
///   load spec -> buildIr -> emit each declaration (model/enum/union/alias)
///   -> emit *Meta classes -> emit each ApiModel -> emit api.dart library
///   -> copy runtime/ verbatim -> write pubspec -> emit the fromJson dispatcher.
///
/// Usage:
///   dart run bin/generate.dart [--spec <path>] [--out <dir>]
library;

import 'dart:io';

import 'package:args/args.dart';
import 'package:code_builder/code_builder.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_alias.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_api.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_context.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_enum.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_library.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_model.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_roundtrip_test.dart';
import 'package:immich_dart_openapi_generator/src/emit/emit_union.dart';
import 'package:immich_dart_openapi_generator/src/ir/types.dart';
import 'package:immich_dart_openapi_generator/src/loader/spec.dart';
import 'package:immich_dart_openapi_generator/src/normalize/builder.dart';
import 'package:path/path.dart' as p;

/// Absolute path of this generator package (the dir containing pubspec.yaml).
final String _packageRoot = _resolvePackageRoot();

String _resolvePackageRoot() {
  // Script lives at <root>/bin/generate.dart.
  final scriptDir = p.dirname(Platform.script.toFilePath());
  return p.normalize(p.join(scriptDir, '..'));
}

ArgParser _buildParser() {
  return ArgParser()
    ..addOption(
      'spec',
      help: 'Path to the OpenAPI 3.0 spec JSON.',
      defaultsTo: p.normalize(p.join(_packageRoot, '..', 'immich-openapi-specs.json')),
    )
    ..addOption(
      'out',
      help: 'Output directory for the generated Dart client.',
      defaultsTo: p.normalize(p.join(_packageRoot, '..', '..', 'mobile', 'openapi')),
    )
    ..addOption('package-name', help: 'Dart package name.', defaultsTo: 'openapi')
    ..addFlag('immutable-models', defaultsTo: true)
    ..addFlag('tolerant-enums', defaultsTo: true)
    ..addFlag('non-null-returns', defaultsTo: true)
    ..addFlag('abort-trigger', defaultsTo: true)
    ..addFlag('version-meta', defaultsTo: true)
    ..addFlag('compat-hook', defaultsTo: true)
    ..addFlag('roundtrip-test', defaultsTo: false, help: 'Also emit test/roundtrip_test.dart.')
    ..addFlag('help', abbr: 'h', negatable: false, help: 'Show usage.');
}

Future<void> main(List<String> argv) async {
  final parser = _buildParser();
  final ArgResults args;
  try {
    args = parser.parse(argv);
  } on FormatException catch (e) {
    stderr.writeln(e.message);
    stderr.writeln(parser.usage);
    exitCode = 64;
    return;
  }

  if (args.flag('help')) {
    stdout.writeln('Immich Dart OpenAPI generator');
    stdout.writeln(parser.usage);
    return;
  }

  final specPath = args.option('spec')!;
  final outDir = args.option('out')!;

  final options = GeneratorOptions(
    specPath: specPath,
    outDir: outDir,
    packageName: args.option('package-name')!,
    immutableModels: args.flag('immutable-models'),
    tolerantEnums: args.flag('tolerant-enums'),
    nonNullReturns: args.flag('non-null-returns'),
    emitAbortTrigger: args.flag('abort-trigger'),
    emitVersionMeta: args.flag('version-meta'),
    emitCompatHook: args.flag('compat-hook'),
    emitRoundtripTest: args.flag('roundtrip-test'),
  );

  final generator = Generator(options);
  final summary = generator.run();
  stdout.writeln(summary);
}

/// Drives the load -> normalize -> emit pipeline and writes the output tree.
class Generator {
  final GeneratorOptions options;
  final EmitContext ctx;

  Generator(this.options) : ctx = EmitContext(options);

  String get _libDir => p.join(options.outDir, 'lib');

  String run() {
    final spec = OpenApiSpec.load(options.specPath);
    final doc = buildIr(spec);

    _cleanGeneratedDirs();

    final declCount = _emitDeclarations(doc);
    final apiCount = _emitApis(doc);
    _emitLibrary(doc);
    final runtimeCount = _copyRuntime(doc);
    _writePubspec();
    if (options.emitRoundtripTest) _emitRoundtripTest(doc);

    return _summarize(doc, declCount, apiCount, runtimeCount);
  }

  /// Remove previously-generated model/api dirs so stale files never linger.
  void _cleanGeneratedDirs() {
    for (final sub in const ['model', 'api']) {
      final dir = Directory(p.join(_libDir, sub));
      if (dir.existsSync()) dir.deleteSync(recursive: true);
    }
  }

  // ── Declarations ──────────────────────────────────────────────────────────

  int _emitDeclarations(IrDocument doc) {
    for (final decl in doc.declarations) {
      final source = switch (decl) {
        ObjectType() => ctx.renderPart(_lib(emitModel(decl, options))),
        EnumType() => ctx.renderPart(_lib(emitEnum(decl, options))),
        AliasType() => ctx.renderPart(_lib(emitAlias(decl))),
        UnionType() => ctx.renderPart(_libAll(emitUnion(decl))),
      };
      ctx.writeFile(p.join(_libDir, 'model', '${decl.meta.fileName}.dart'), source);
    }
    return doc.declarations.length;
  }

  // ── APIs ────────────────────────────────────────────────────────────────────

  int _emitApis(IrDocument doc) {
    for (final api in doc.apis) {
      final source = ctx.renderPart(_lib(emitApi(api, options)));
      ctx.writeFile(p.join(_libDir, 'api', '${api.fileName}.dart'), source);
    }
    return doc.apis.length;
  }

  // ── Library file ──────────────────────────────────────────────────────────

  void _emitLibrary(IrDocument doc) {
    final source = LibraryEmitter(options).render(doc);
    ctx.writeFile(p.join(_libDir, 'api.dart'), ctx.format(source));
  }

  // ── Runtime files ───────────────────────────────────────────────────────────

  /// Copy every `runtime/*.dart` into the output `lib/` tree, resolving the
  /// `deserializeNamed` dispatcher injection point with the real type list.
  int _copyRuntime(IrDocument doc) {
    final runtimeDir = Directory(p.join(_packageRoot, 'runtime'));
    final dispatcher = _renderDispatcher(doc);

    var count = 0;
    for (final entity in runtimeDir.listSync(recursive: true)) {
      if (entity is! File) continue;
      if (!entity.path.endsWith('.dart')) continue;

      final rel = p.relative(entity.path, from: runtimeDir.path);
      var contents = entity.readAsStringSync();

      if (rel == 'api_client.dart') {
        contents = _injectDispatcher(contents, dispatcher);
      }

      ctx.writeFile(p.join(_libDir, rel), contents);
      count++;
    }
    return count;
  }

  /// Replace the runtime's `deserializeNamed` stub with the generated switch.
  String _injectDispatcher(String contents, String dispatcher) {
    const stub = 'dynamic deserializeNamed(dynamic value, String targetType) => _noMatch;';
    if (!contents.contains(stub)) {
      throw StateError('Could not find deserializeNamed stub in api_client.dart');
    }
    return contents.replaceFirst(stub, dispatcher);
  }

  /// The generated `deserializeNamed` switch over every declaration dartName.
  ///
  /// Aliases are skipped: a `typedef A = B;` has no `A.fromJson`, and the alias
  /// target (`B`) is itself a declaration with its own case, so wire targets
  /// using the alias name resolve through the runtime's collection/scalar
  /// handling and then fall through — but every named declaration with a real
  /// `fromJson` (objects, enums, unions) gets a case here.
  String _renderDispatcher(IrDocument doc) {
    final names = <String>{};
    for (final decl in doc.declarations) {
      switch (decl) {
        case ObjectType():
        case EnumType():
        case UnionType():
          names.add(decl.meta.dartName);
        case AliasType():
          // typedef: no own fromJson; resolves via the target's case.
          break;
      }
    }
    final sorted = names.toList()..sort();

    final cases = StringBuffer();
    for (final name in sorted) {
      cases.writeln("    case '$name':");
      cases.writeln('      return $name.fromJson(value);');
    }

    return 'dynamic deserializeNamed(dynamic value, String targetType) {\n'
        '  switch (targetType) {\n'
        '$cases'
        '    default:\n'
        '      return _noMatch;\n'
        '  }\n'
        '}';
  }

  // ── Pubspec ───────────────────────────────────────────────────────────────

  void _writePubspec() {
    final fragment = File(p.join(_packageRoot, 'runtime', 'pubspec.fragment.yaml'));
    ctx.writeFile(p.join(options.outDir, 'pubspec.yaml'), fragment.readAsStringSync());
  }

  // ── Round-trip test ─────────────────────────────────────────────────────────

  void _emitRoundtripTest(IrDocument doc) {
    final source = emitRoundtripTest(doc, options);
    ctx.writeFile(p.join(options.outDir, 'test', 'roundtrip_test.dart'), source);
  }

  // ── Spec wrappers ───────────────────────────────────────────────────────────

  /// Wrap a single `code_builder` [spec] in a Library.
  Library _lib(Spec spec) => Library((b) => b..body.add(spec));

  /// Wrap multiple `code_builder` specs (e.g. a union's base + leaves).
  Library _libAll(Iterable<Spec> specs) => Library((b) => b..body.addAll(specs));

  String _summarize(IrDocument doc, int declCount, int apiCount, int runtimeCount) {
    final objects = doc.declarations.whereType<ObjectType>().length;
    final enums = doc.declarations.whereType<EnumType>().length;
    final unions = doc.declarations.whereType<UnionType>().length;
    final aliases = doc.declarations.whereType<AliasType>().length;
    return [
      'Generated client at ${options.outDir}',
      '  declarations: $declCount (objects=$objects enums=$enums unions=$unions aliases=$aliases)',
      '  apis:         $apiCount',
      '  runtime:      $runtimeCount',
    ].join('\n');
  }
}
