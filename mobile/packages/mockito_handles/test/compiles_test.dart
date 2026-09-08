import 'package:analyzer/dart/analysis/results.dart';
import 'package:analyzer/error/error.dart';
import 'package:build/build.dart';
import 'package:build_test/build_test.dart';
import 'package:mockito_handles/mockito_handles.dart';
import 'package:test/test.dart';

/// Runs the builder, then analyses its output against the real `mockito` and
/// `matcher`, and fails on any error-severity diagnostic.
///
/// Every other test asserts on the emitted *text*, which cannot tell whether the
/// text is valid Dart. A missing import prefix, a type argument dropped from a
/// generic, a duplicate declaration or an illegal parameter name all read fine
/// as a string and land here instead.
Future<void> expectCompiles(String interfaces, String mocks) async {
  final built = await testBuilder(
    const MockHandlesBuilder(),
    {'mockito|lib/mockito.dart': 'class Mock {}', 'pkg|lib/api.dart': interfaces, 'pkg|test/target.mocks.dart': mocks},
    rootPackage: 'pkg',
    generateFor: {'pkg|test/target.mocks.dart'},
  );
  final produced = built.readerWriter.testing.assets.where((a) => a.path.endsWith('.handles.dart'));
  expect(produced, isNotEmpty, reason: 'the builder emitted nothing to resolve');
  final handles = built.readerWriter.testing.readString(produced.first);

  await resolveSources(
    {'pkg|lib/api.dart': interfaces, 'pkg|test/target.mocks.dart': mocks, 'pkg|test/target.handles.dart': handles},
    readAllSourcesFromFilesystem: true,
    (resolver) async {
      final library = await resolver.libraryFor(AssetId('pkg', 'test/target.handles.dart'));
      expect(library.extensionTypes, isNotEmpty, reason: 'no handles were declared at all');

      // The element model alone is not enough: an illegal private named parameter
      // or a duplicate declaration resolves to a perfectly ordinary-looking type.
      // Only the diagnostics say whether it would actually compile.
      final path = library.firstFragment.source.fullName;
      final errors = await library.session.getErrors(path);
      final blocking = switch (errors) {
        ErrorsResult(:final diagnostics) =>
          diagnostics.where((d) => d.diagnosticCode.severity == DiagnosticSeverity.ERROR).toList(),
        _ => fail('could not analyse the generated library at $path'),
      };

      expect(
        blocking,
        isEmpty,
        reason: 'generated source does not compile:\n${blocking.map((d) => '  ${d.message}').join('\n')}\n\n$handles',
      );
    },
  );
}

void main() {
  test('a method, a getter and a setter all compile together', () async {
    await expectCompiles(
      '''
class Asset {
  const Asset(this.id);
  final String id;
}

abstract class Repo {
  Future<List<Asset>> assetsIn(String albumId, {bool deep = false});
  int count(List<String> ids);
  Future<void> purge();
  String get label;
  set label(String value);
}
''',
      '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<List<Asset>> assetsIn(String? albumId, {bool? deep = false}) =>
      super.noSuchMethod(
        Invocation.method(#assetsIn, [albumId], {#deep: deep}),
        returnValue: Future<List<Asset>>.value(<Asset>[]),
      ) as Future<List<Asset>>;
  @override
  int count(List<String>? ids) =>
      super.noSuchMethod(Invocation.method(#count, [ids]), returnValue: 0) as int;
  @override
  Future<void> purge() =>
      super.noSuchMethod(Invocation.method(#purge, []), returnValue: Future<void>.value()) as Future<void>;
  @override
  String get label => super.noSuchMethod(Invocation.getter(#label), returnValue: '') as String;
  @override
  set label(String? value) => super.noSuchMethod(Invocation.setter(#label, value));
}
''',
    );
  });

  // A positional parameter may be named `_`, which is a wildcard, or `_x`, which
  // cannot become the named parameter `calledWithMatching` turns it into. Both
  // read fine as text and neither resolves.
  test('a wildcard and an underscore-prefixed parameter compile', () async {
    await expectCompiles(
      '''
abstract class Repo {
  int poke(int _, String _x);
}
''',
      '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  int poke(int? p0, String? p1) =>
      super.noSuchMethod(Invocation.method(#poke, [p0, p1]), returnValue: 0) as int;
}
''',
    );
  });

  test('records and function types compile with their import prefixes', () async {
    await expectCompiles(
      '''
class Asset {
  const Asset(this.id);
  final String id;
}

abstract class Repo {
  (Asset, {int total}) summarise(List<Asset> assets);
  void listen(void Function(Asset asset)? onEach);
  (int,) single();
}
''',
      '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  (Asset, {int total}) summarise(List<Asset>? assets) =>
      super.noSuchMethod(
        Invocation.method(#summarise, [assets]),
        returnValue: (const Asset(''), total: 0),
      ) as (Asset, {int total});
  @override
  void listen(void Function(Asset)? onEach) => super.noSuchMethod(Invocation.method(#listen, [onEach]));
  @override
  (int,) single() => super.noSuchMethod(Invocation.method(#single, []), returnValue: (0,)) as (int,);
}
''',
    );
  });

  // Found by running the builder against flutter/packages: pigeon marks its
  // generated ProxyApi plumbing `@protected`, the origin rule correctly calls it
  // owned, and every handle reference was then an `invalid_use_of_protected_member`
  // warning — which `ignore_for_file: type=lint` does not silence.
  test('a protected member gets no handle', () async {
    await expectCompiles(
      '''
import 'package:meta/meta.dart';

abstract class Repo {
  @protected
  int internals();
  int public();
}
''',
      '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  int internals() => super.noSuchMethod(Invocation.method(#internals, []), returnValue: 0) as int;
  @override
  int public() => super.noSuchMethod(Invocation.method(#public, []), returnValue: 0) as int;
}
''',
    );
  });

  // A `FutureOr<T>` member may return a bare `T`, and a caller branching on
  // `result is T` versus `result is Future<T>` takes a different path for each.
  // Offering only `mockResolvedValue` silently forces the async branch.
  test('a FutureOr member can be stubbed synchronously or asynchronously', () async {
    await expectCompiles(
      '''
import 'dart:async';

abstract class Repo {
  FutureOr<bool> allow(String url);
}
''',
      '''
import 'dart:async';

import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  FutureOr<bool> allow(String? url) =>
      super.noSuchMethod(Invocation.method(#allow, [url]), returnValue: false) as FutureOr<bool>;
}
''',
    );
  });
}
