/// A `build_runner` builder that emits typed, jest-shaped handles over
/// [mockito](https://pub.dev/packages/mockito)'s generated mocks.
///
/// Wire it up by adding `mockito_handles` to `dev_dependencies`; the builder applies
/// itself to any package that depends on it. See the README for the generated
/// API and the `additional_owned_packages` option.
library;

import 'package:build/build.dart';
import 'package:dart_style/dart_style.dart';

import 'src/discovery.dart';
import 'src/emitter.dart';
import 'src/type_renderer.dart';

/// The builder factory named by `build.yaml`.
///
/// Reads the `additional_owned_packages` and `page_width` options. See
/// [MockHandlesBuilder.additionalOwnedPackages] and
/// [MockHandlesBuilder.pageWidth].
Builder mockHandlesBuilder(BuilderOptions options) {
  final configured = options.config['additional_owned_packages'] as List? ?? const [];
  return MockHandlesBuilder(
    additionalOwnedPackages: {...configured.cast<String>()},
    pageWidth: options.config['page_width'] as int?,
  );
}

/// Turns `foo.mocks.dart` into `foo.handles.dart`.
///
/// Runs after mockito rather than alongside it: `build.yaml` declares
/// `required_inputs: ['.mocks.dart']`, which tells `build_runner` not to start
/// this builder until every builder that could emit a `.mocks.dart` has
/// finished. Handles therefore can never be generated against a stale set of
/// mocks, and a consumer needs no second command.
class MockHandlesBuilder implements Builder {
  /// Creates the builder, optionally widening the set of owned packages.
  const MockHandlesBuilder({this.additionalOwnedPackages = const {}, this.pageWidth});

  /// Owned packages *beyond* the one being built.
  ///
  /// A member gets a handle only if the element declaring it lives in an owned
  /// package, which is what keeps inherited framework and SDK members out of the
  /// generated facades. The package under build is always owned, so the builder
  /// needs no configuration; a project whose mocked types reach into another
  /// package it also controls — a generated API client, say — names that here.
  final Set<String> additionalOwnedPackages;

  /// The column the emitted source is wrapped at, defaulting to `dart_style`'s
  /// own 80.
  ///
  /// Set this to match the project's `formatter: page_width:` if it declares
  /// one. `dart format` reads that setting, so a repo-wide
  /// `--set-exit-if-changed` check would otherwise report every generated file
  /// as needing a reformat.
  final int? pageWidth;

  @override
  Map<String, List<String>> get buildExtensions => const {
    '.mocks.dart': ['.handles.dart'],
  };

  @override
  Future<void> build(BuildStep buildStep) async {
    final library = await buildStep.inputLibrary;
    final targets = targetsIn(library, onWarning: log.warning);
    if (targets.isEmpty) return;

    final emitter = Emitter(
      TypeRenderer(),
      mocksImport: buildStep.inputId.pathSegments.last,
      ownedPackages: {buildStep.inputId.package, ...additionalOwnedPackages},
    );
    for (final target in targets) {
      emitter.emitTarget(target);
    }

    for (final skipped in emitter.skipped) {
      log.info('skipped ${skipped.name} — ${skipped.reason}');
    }

    final output = buildStep.allowedOutputs.single;
    await buildStep.writeAsString(output, _format(emitter.finish(), output));
    log.info('${output.path}: ${emitter.facadeCount} facades, ${emitter.handleCount} member handles');
  }

  /// Formats [source] so a repo-wide `dart format --set-exit-if-changed` check
  /// does not fail on generated output.
  ///
  /// The emitter writes one statement per line and makes no attempt to wrap, so
  /// a wide signature can run to hundreds of characters. Formatting is a
  /// courtesy rather than a correctness requirement, so a failure here returns
  /// the source unchanged: unformatted handles still compile, and losing the
  /// file to a formatter edge case would not be a fair trade.
  String _format(String source, AssetId output) {
    try {
      return DartFormatter(
        languageVersion: DartFormatter.latestLanguageVersion,
        pageWidth: pageWidth ?? 80,
      ).format(source);
    } on FormatterException catch (e) {
      log.warning('${output.path}: emitted source could not be formatted, writing it unformatted — $e');
      return source;
    }
  }
}
