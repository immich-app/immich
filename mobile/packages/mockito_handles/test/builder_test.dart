import 'package:build_test/build_test.dart';
import 'package:mockito_handles/mockito_handles.dart';
import 'package:test/test.dart';

/// Minimal stand-ins for the packages the builder keys on.
///
/// `mockito` and `mocktail` both declare a class called `Mock`; that collision is
/// real and the builder must tell them apart by library URI, so both are present
/// in every fixture.
const _packages = <String, String>{
  'mockito|lib/mockito.dart': 'class Mock {}',
  'mocktail|lib/mocktail.dart': 'class Mock {}',
  // The analyzer recognises `@protected` by matching a top-level getter called
  // `protected` in a library *named* `meta`, so the stub needs the `library`
  // declaration — the file path alone is not enough.
  'meta|lib/meta.dart': '''
library meta;

class _Protected {
  const _Protected();
}

const protected = _Protected();
''',
  'foreign|lib/foreign.dart': '''
abstract class ForeignBase {
  Future<void> foreignMember(String x);
}
''',
};

/// Runs the builder over [interfaces] plus a mocks library, and returns the
/// generated source.
///
/// [mocks] is written as mockito's builder would write it — parameters widened
/// to nullable — so the tests exercise the real input shape rather than an
/// idealised one.
Future<String> generate({
  required String interfaces,
  required String mocks,
  Set<String> additionalOwnedPackages = const {},
  Map<String, String> extraSources = const {},
}) async {
  final result = await testBuilder(
    MockHandlesBuilder(additionalOwnedPackages: additionalOwnedPackages),
    {..._packages, ...extraSources, 'pkg|lib/api.dart': interfaces, 'pkg|test/target.mocks.dart': mocks},
    rootPackage: 'pkg',
    generateFor: {'pkg|test/target.mocks.dart'},
  );

  // Outputs land in the build-cache package rather than at their nominal id, so
  // they are found by extension instead of by a hard-coded path. An empty result
  // means the builder declined to emit, which is itself an assertable outcome.
  final produced = result.readerWriter.testing.assets.where((a) => a.path.endsWith('.handles.dart'));
  return produced.isEmpty ? '' : result.readerWriter.testing.readString(produced.first);
}

/// Whitespace-insensitive `contains`, for assertions about emitted code.
///
/// The builder runs `dart_style` over its output, so where a line wraps is the
/// formatter's decision and not something a test should pin down. Collapsing
/// runs of whitespace on both sides keeps these assertions about the code.
Matcher containsCode(String snippet) =>
    predicate<String>((source) => _collapse(source).contains(_collapse(snippet)), 'contains code `$snippet`');

String _collapse(String source) => source.replaceAll(RegExp(r'\s+'), ' ').trim();

/// The `calledWith` parameter list on its own.
///
/// Assertions about the verify surface must not be satisfied by
/// `mockImplementation`'s callback type, which shares most of its text.
String calledWithOf(String source) =>
    RegExp(r'void calledWith\((.*?)\) =>', dotAll: true).firstMatch(source)?.group(1) ?? '';

void main() {
  group('signature fidelity', () {
    // The reason this builder reads the interface element rather than mockito's
    // generated override. mockito widens every non-nullable parameter so its
    // `Null get any` can be passed; inheriting that widening would let
    // `calledWith(null)` compile against a non-nullable API.
    test('a non-nullable parameter stays non-nullable despite mockito widening', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<int> count(List<String> ids);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<int> count(List<String>? ids) => super.noSuchMethod(Invocation.method(#count, [ids])) as Future<int>;
}
''',
      );

      expect(source, containsCode('void calledWith(List<String> ids)'));
      expect(source, isNot(containsCode('void calledWith(List<String>? ids)')));
    });

    test('a genuinely nullable parameter keeps its question mark', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<void> setName(String? name);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<void> setName(String? name) => super.noSuchMethod(Invocation.method(#setName, [name])) as Future<void>;
}
''',
      );

      expect(source, containsCode('void calledWith(String? name)'));
    });
  });

  group('the not chain', () {
    Future<String> methodFixture() => generate(
      interfaces: '''
abstract class Repo {
  Future<int> count(List<String> ids, {bool deep = false});
}
''',
      mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<int> count(List<String>? ids, {bool? deep = false}) =>
      super.noSuchMethod(Invocation.method(#count, [ids], {#deep: deep})) as Future<int>;
}
''',
    );

    test('every verify form has a negation with the same signature', () async {
      final source = await methodFixture();

      expect(source, containsCode(r'$Repo$count$Not get not => $Repo$count$Not(_m);'));
      expect(
        source,
        containsCode(
          'void calledWith(List<String> ids, {bool deep = false}) => _k.verifyNever(_m.count(ids, deep: deep));',
        ),
      );
      expect(source, containsCode('void called() => _k.verifyNever('));
      expect(source, containsCode('void calledWithMatching({Object? ids, Object? deep}) => _k.verifyNever('));
    });

    // `verifyNever` already asserts the count is zero. mockito's `called()` on a
    // `verifyNever` result would pass for any count, so a negation must never
    // carry one.
    test('a negation never carries a called count', () async {
      final source = await methodFixture();
      final negations = RegExp(r'_k\.verifyNever\([^;]*\)\.called').allMatches(source);

      expect(negations, isEmpty);
    });

    // `.not` is verification-only. Inverting `mockResolvedValue` is meaningless,
    // so the negated type must not expose any stub.
    test('no stub is reachable through not', () async {
      final source = await methodFixture();
      final not = RegExp(r'extension type const \$Repo\$count\$Not[^}]*\}').stringMatch(source)!;

      expect(not, isNot(contains('mock')));
    });

    test('the un-negated handle no longer spells its own negation', () async {
      final source = await methodFixture();

      expect(source, isNot(containsCode('neverCalled')));
    });

    test('a setter negates its value, a getter only its read', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  set onDone(void Function()? cb);
  String get name;
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  set onDone(void Function()? cb) => super.noSuchMethod(Invocation.setter(#onDone, cb));
  @override
  String get name => super.noSuchMethod(Invocation.getter(#name), returnValue: '') as String;
}
''',
      );

      expect(source, containsCode('void calledWith(void Function()? value) => _k.verifyNever(_m.onDone = value);'));
      // A getter is read, not invoked — no `()` and nothing to pass.
      expect(source, containsCode('void called() => _k.verifyNever(_m.name);'));
    });
  });

  group('named parameters', () {
    Future<String> namedFixture(String params) => generate(
      interfaces:
          '''
enum Mode { fast, slow }

abstract class Repo {
  Future<void> run(String id, {$params});
}
''',
      mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<void> run(String? id, {Mode? mode, bool? flag, String? note}) =>
      super.noSuchMethod(Invocation.method(#run, [id], {#mode: mode, #flag: flag, #note: note})) as Future<void>;
}
''',
    );

    test('a defaulted parameter keeps its default, import-prefixed', () async {
      final source = await namedFixture('Mode mode = Mode.fast, bool flag = false, String? note');
      // The prefix is what makes the default usable at all: `defaultValueCode` is
      // raw source from the declaring library, so a bare `Mode.fast` would not
      // resolve here.
      expect(calledWithOf(source), matches(RegExp(r'p\d+\.Mode mode = p\d+\.Mode\.fast')));
      expect(calledWithOf(source), contains('bool flag = false'));
    });

    test('a required parameter stays required', () async {
      final source = await namedFixture('required Mode mode, required bool flag, String? note');
      expect(calledWithOf(source), matches(RegExp(r'required p\d+\.Mode mode')));
      expect(calledWithOf(source), contains('required bool flag'));
    });

    // An optional nullable parameter already defaults to null, so forcing the
    // caller to state it would be stricter than the real API. Scoped to
    // `calledWith` deliberately: `mockImplementation`'s callback marks every
    // named parameter `required`, because the Invocation always carries one.
    test('an optional nullable parameter is neither required nor defaulted', () async {
      final source = await namedFixture('required Mode mode, required bool flag, String? note');
      expect(calledWithOf(source), contains('String? note'));
      expect(calledWithOf(source), isNot(contains('required String? note')));
    });
  });

  group('stub shape', () {
    Future<String> returning(String type, String body) => generate(
      interfaces:
          '''
import 'dart:async';

abstract class Repo {
  $type value();
}
''',
      mocks:
          '''
import 'dart:async';

import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  $type value() => super.noSuchMethod(Invocation.method(#value, []), returnValue: $body) as $type;
}
''',
    );

    test('an async member gets mockResolvedValue', () async {
      final source = await returning('Future<int>', 'Future<int>.value(0)');
      expect(source, containsCode('void mockResolvedValue(int value)'));
      expect(source, isNot(containsCode('mockReturnValue')));
    });

    test('a sync member gets mockReturnValue', () async {
      final source = await returning('int', '0');
      expect(source, containsCode('void mockReturnValue(int value)'));
      expect(source, isNot(containsCode('mockResolvedValue')));
    });

    // A void return carries no information, so the stub takes no argument.
    test('an async void member takes no stub argument', () async {
      final source = await returning('Future<void>', 'Future<void>.value()');
      expect(source, containsCode('void mockResolvedValue() =>'));
    });

    // mockito rejects `thenReturn` outright for a Stream or Future return
    // (mock.dart:629). It is a *runtime* ArgumentError, not a type error, so the
    // analyzer cannot catch a regression here — only these tests and the suite can.
    test('a synchronous Stream return is stubbed with thenAnswer, not thenReturn', () async {
      final source = await returning('Stream<int>', 'Stream<int>.empty()');
      // `Stream` is from dart:async, so it carries an import prefix — dart:core
      // is the only library the renderer leaves bare.
      expect(source, matches(RegExp(r'void mockReturnValue\(p\d+\.Stream<int> value\)')));
      expect(source, containsCode('thenAnswer((_) => value)'));
      expect(source, isNot(containsCode('thenReturn')));
    });

    // Applied universally rather than special-cased for Stream: `thenAnswer` is
    // valid for every return type, so there is no case left to get wrong.
    test('mockReturnValue never emits thenReturn, whatever the return type', () async {
      for (final (type, dummy) in [
        ('int', '0'),
        ('String', "''"),
        ('Stream<int>', 'Stream<int>.empty()'),
        ('bool', 'false'),
      ]) {
        final source = await returning(type, dummy);
        expect(source, isNot(containsCode('thenReturn')), reason: 'thenReturn emitted for $type');
      }
    });

    test('a synchronous void member takes no stub argument', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  void poke();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  void poke() => super.noSuchMethod(Invocation.method(#poke, []));
}
''',
      );
      expect(source, containsCode('void mockReturnValue() =>'));
      expect(source, isNot(containsCode('thenReturn')));
    });

    // `thenThrow` throws synchronously, which an async member never does.
    test('an async rejection goes through Future.error, not thenThrow', () async {
      final source = await returning('Future<int>', 'Future<int>.value(0)');
      expect(source, containsCode('Future<int>.error(error)'));
      expect(source, isNot(containsCode('mockRejectedValue(Object error) => _k.when(_m.value()).thenThrow')));
    });
  });

  group('mockImplementation', () {
    // The jest idiom for argument-dependent stubbing is a predicate on the real
    // arguments. Handing over an `Invocation` instead would push
    // `positionalArguments[0] as T` into every such test.
    test('receives real typed arguments rather than an Invocation', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<int> count(List<String> ids, {required bool deep});
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<int> count(List<String>? ids, {bool? deep}) =>
      super.noSuchMethod(Invocation.method(#count, [ids], {#deep: deep})) as Future<int>;
}
''',
      );

      expect(source, containsCode('Function(List<String> ids, {required bool deep})'));
      expect(source, containsCode('i.positionalArguments[0] as List<String>'));
      expect(source, containsCode('deep: i.namedArguments[#deep] as bool'));
      expect(source, isNot(containsCode('Function(Invocation)')));
    });
  });

  group('member selection', () {
    test('a generic member is skipped, because any cannot be reified', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<T> transaction<T>(Future<T> Function() callback);
  Future<int> count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<T> transaction<T>(Future<T> Function()? callback) =>
      super.noSuchMethod(Invocation.method(#transaction, [callback])) as Future<T>;
  @override
  Future<int> count() => super.noSuchMethod(Invocation.method(#count, [])) as Future<int>;
}
''',
      );

      expect(source, containsCode(r'$Repo$count'));
      expect(source, isNot(containsCode(r'$Repo$transaction')));
    });

    // The origin rule: a member is emitted only if the element declaring it lives
    // in an owned package. Keeps ~60 dart:async members off Stream subtypes
    // without naming a single one of them.
    test('a member inherited from a foreign package is skipped', () async {
      final source = await generate(
        interfaces: '''
import 'package:foreign/foreign.dart';

abstract class Repo implements ForeignBase {
  Future<int> count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<void> foreignMember(String? x) =>
      super.noSuchMethod(Invocation.method(#foreignMember, [x])) as Future<void>;
  @override
  Future<int> count() => super.noSuchMethod(Invocation.method(#count, [])) as Future<int>;
}
''',
      );

      expect(source, containsCode(r'$Repo$count'));
      expect(source, isNot(containsCode('foreignMember')));
    });

    // The origin rule is configuration, not a hard-coded package list. The
    // package being built is always owned, so the builder drops into any project
    // unconfigured; `additional_owned_packages` only *adds* to that.
    Future<String> foreignFixture({Set<String> additionalOwnedPackages = const {}}) => generate(
      additionalOwnedPackages: additionalOwnedPackages,
      interfaces: '''
import 'package:foreign/foreign.dart';

abstract class Repo implements ForeignBase {
  Future<int> count();
}
''',
      mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<void> foreignMember(String? x) =>
      super.noSuchMethod(Invocation.method(#foreignMember, [x])) as Future<void>;
  @override
  Future<int> count() => super.noSuchMethod(Invocation.method(#count, [])) as Future<int>;
}
''',
    );

    test('additional_owned_packages brings a foreign package back', () async {
      // Note only `foreign` is named — the package being built stays owned, so
      // `Repo`'s own members survive alongside the ones this adds.
      final source = await foreignFixture(additionalOwnedPackages: {'foreign'});

      expect(source, containsCode('foreignMember'));
      expect(source, containsCode(r'$Repo$count'));
    });

    test('unconfigured, the package being built is the only owned one', () async {
      final source = await foreignFixture();

      expect(source, containsCode(r'$Repo$count'));
      expect(source, isNot(containsCode('foreignMember')));
    });

    // Regression: mocktail's base class is also called `Mock`, and this repo has
    // hand-written mocktail declarations in files ending `.mocks.dart` — the very
    // pattern this builder is applied to. Matching on the name alone emitted
    // handles that used mockito's `Null get any` against unwidened parameters,
    // for 1689 analyzer errors.
    test('a mocktail mock is ignored entirely', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<int> count();
}
''',
        mocks: '''
import 'package:mocktail/mocktail.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {}
''',
      );

      expect(source, isEmpty);
    });
  });

  group('accessors', () {
    test('a getter is read, not invoked', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  String get name;
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  String get name => super.noSuchMethod(Invocation.getter(#name), returnValue: '') as String;
}
''',
      );

      expect(source, containsCode('_k.verify(_m.name).called(1)'));
      expect(source, isNot(containsCode('_m.name()')));
    });

    // A setter shares its name with the getter, so it needs a distinct accessor.
    test('a setter is exposed as setX', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  set name(String value);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  set name(String? value) => super.noSuchMethod(Invocation.setter(#name, value));
}
''',
      );

      expect(source, containsCode(r'$Repo$setName get setName'));
      expect(source, containsCode('_m.name = value'));
    });
  });

  group('facade', () {
    test('builds its own mock and can wrap an existing one', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<int> count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<int> count() => super.noSuchMethod(Invocation.method(#count, [])) as Future<int>;
}
''',
      );

      expect(source, containsCode('extension type const RepoMock.of(MockRepo mock)'));
      expect(source, containsCode('RepoMock() : this.of(MockRepo());'));
      expect(source, containsCode('void reset() => _k.reset(mock);'));
      expect(source, containsCode('void zeroInteractions() => _k.verifyZeroInteractions(mock);'));
    });

    // No fallback registry, no per-facade stubbing policy: mockito bakes a
    // default into every generated member, so both are redundant here.
    test('emits no fallback registry and no stubbing policy', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<int> count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<int> count() => super.noSuchMethod(Invocation.method(#count, [])) as Future<int>;
}
''',
      );

      expect(source, isNot(containsCode('registerFallbackValue')));
      expect(source, isNot(containsCode('stubVoidReturns')));
      expect(source, isNot(containsCode('stubNiceDefaults')));
    });
  });

  // Signatures that produced source which did not compile, or which quietly
  // changed the API a caller had to use. Each of these was a real defect.
  group('signatures that must not break the output', () {
    test('a setter does not collide with a method of its derived name', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  set name(String value);
  void setName(String value);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  set name(String? value) => super.noSuchMethod(Invocation.setter(#name, value));
  @override
  void setName(String? value) => super.noSuchMethod(Invocation.method(#setName, [value]));
}
''',
      );

      // Both want the accessor `setName`. Emitting it twice is a duplicate
      // extension type, and the generated library does not compile.
      final declarations = RegExp(
        r'^extension type const (\$Repo\$\w+)\(',
        multiLine: true,
      ).allMatches(source).map((m) => m.group(1)).toList();

      expect(declarations, declarations.toSet().toList(), reason: 'every handle name must be unique');
      expect(declarations, contains(r'$Repo$setName'));
      expect(declarations, contains(r'$Repo$setName2'));
    });

    test('an operator is skipped rather than emitted as a broken accessor', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  int operator +(int other);
  Future<int> count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  int operator +(int? other) => super.noSuchMethod(Invocation.method(#+, [other]), returnValue: 0) as int;
  @override
  Future<int> count() => super.noSuchMethod(Invocation.method(#count, [])) as Future<int>;
}
''',
      );

      // `$Repo$+` is not an identifier and `_m.+(other)` is not an invocation.
      expect(source, isNot(containsCode(r'$Repo$+')));
      expect(source, isNot(containsCode('_m.+(')));
      expect(source, containsCode(r'$Repo$count'), reason: 'the rest of the type still emits');
    });

    test('a default naming something the generated file cannot see becomes required', () async {
      final source = await generate(
        interfaces: '''
class Durations {
  static const Duration short = Duration(milliseconds: 50);
}

const kAnimDuration = Duration(seconds: 1);

abstract class Repo {
  void run({Duration a = kAnimDuration, Duration b = Durations.short, Duration c = Duration.zero});
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  void run({Duration? a, Duration? b, Duration? c}) =>
      super.noSuchMethod(Invocation.method(#run, [], {#a: a, #b: b, #c: c}));
}
''',
      );

      final params = calledWithOf(source);
      // Neither name is imported into the generated library, so copying either
      // would emit an undefined identifier.
      expect(params, isNot(contains('kAnimDuration')));
      expect(params, isNot(contains('Durations.short')));
      expect(params, contains('required Duration a'));
      expect(params, contains('required Duration b'));
      // Rooted at the parameter's own type, so it survives.
      expect(params, contains('Duration c = Duration.zero'));
    });

    test('a dot-shorthand default survives', () async {
      final source = await generate(
        interfaces: '''
class Option<T> {
  const Option.none();
  const Option.some(T value);
}

abstract class Repo {
  void run({Option<String> name = const .none()});
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  void run({Option<String>? name}) => super.noSuchMethod(Invocation.method(#run, [], {#name: name}));
}
''',
      );

      // `none` is resolved against the parameter type the emitter itself
      // writes, so it needs no import and must not be mistaken for a free name.
      expect(calledWithOf(source), contains('name = const .none()'));
      expect(calledWithOf(source), isNot(contains('required')));
    });

    test('a generic function type is in scope for its own return type', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  void usesT(T Function<T>(T v) fn);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  void usesT(T Function<T>(T v)? fn) => super.noSuchMethod(Invocation.method(#usesT, [fn]));
}
''',
      );

      // `T` must be pushed into scope before the return type is written, not
      // after — otherwise the return position renders as unrenderable and the
      // whole member is silently dropped.
      expect(source, containsCode(r'$Repo$usesT'));
      expect(calledWithOf(source), 'T Function<T>(T) fn');
    });

    test('optional positional parameters stay optional', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<int> count(String id, [bool deep = false, int? limit]);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<int> count(String? id, [bool? deep = false, int? limit]) =>
      super.noSuchMethod(Invocation.method(#count, [id, deep, limit])) as Future<int>;
}
''',
      );

      // Flattening these to required would force every call site to state
      // arguments the real API lets it omit.
      expect(calledWithOf(source), 'String id, [bool deep = false, int? limit]');
    });

    test('a member named after one the facade declares is suffixed', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  void reset();
  void keep();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  void reset() => super.noSuchMethod(Invocation.method(#reset, []));
  @override
  void keep() => super.noSuchMethod(Invocation.method(#keep, []));
}
''',
      );

      // The facade declares its own `reset()`, so the accessor gives way. The
      // member is still reachable, and still calls the real `reset`.
      expect(source, containsCode(r'$Repo$resetMember get resetMember'));
      expect(source, containsCode('_k.when(_m.reset())'));
      expect(source, containsCode(r'$Repo$keep get keep'));
    });

    test('a getter and a setter of the same name both survive', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  String get label;
  set label(String value);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  String get label => super.noSuchMethod(Invocation.getter(#label), returnValue: '') as String;
  @override
  set label(String? value) => super.noSuchMethod(Invocation.setter(#label, value));
}
''',
      );

      // The setter's accessor is derived, so the pair does not collide.
      expect(source, containsCode(r'$Repo$label get label'));
      expect(source, containsCode(r'$Repo$setLabel get setLabel'));
    });

    test('two targets with the same simple name do not collide', () async {
      final source = await generate(
        extraSources: {
          'pkg|lib/other.dart': '''
abstract class Repo {
  int other();
}
''',
        },
        interfaces: '''
abstract class Repo {
  int first();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';
import 'package:pkg/other.dart' as other;

class MockRepo extends Mock implements Repo {
  @override
  int first() => super.noSuchMethod(Invocation.method(#first, []), returnValue: 0) as int;
}

class MockOtherRepo extends Mock implements other.Repo {
  @override
  int other() => super.noSuchMethod(Invocation.method(#other, []), returnValue: 0) as int;
}
''',
      );

      // Both facades exist under distinct names rather than one overwriting the
      // other's declarations.
      expect(source, containsCode('extension type const RepoMock.of'));
      expect(source, containsCode('extension type const Repo2Mock.of'));
    });

    // The member's return type is the class's own `T`, which has no spelling at
    // the emission point. It must cost that member its handle, not the build.
    test('a member naming a class type parameter is skipped, not fatal', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo<T> {
  T fetch();
  int count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo<int> {
  @override
  int fetch() => super.noSuchMethod(Invocation.method(#fetch, []), returnValue: 0) as int;
  @override
  int count() => super.noSuchMethod(Invocation.method(#count, []), returnValue: 0) as int;
}
''',
      );

      expect(source, containsCode(r'$Repo$count get count'));
      expect(source, isNot(containsCode(r'$Repo$fetch')));
    });

    test('a synchronous member can be made to throw', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  int count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  int count() => super.noSuchMethod(Invocation.method(#count, []), returnValue: 0) as int;
}
''',
      );

      expect(source, containsCode('void mockThrow(Object error) => _k.when(_m.count()).thenThrow(error);'));
    });

    test('calls chunks the flat capture list by the member arity', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  void pair(String a, int b);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  void pair(String? a, int? b) => super.noSuchMethod(Invocation.method(#pair, [a, b]));
}
''',
      );

      // mockito's `captured` is flat across every call, so grouping per call is
      // chunking by arity — and getting the arity wrong silently misaligns it.
      expect(source, containsCode('const arity = 2;'));
      // Each chunk is a record named after the real parameters, so a test reads
      // `calls.single.b` rather than counting to `calls.single[1]`.
      expect(source, containsCode('List<({String a, int b})> get calls {'));
      expect(source, containsCode('(a: flat[i + 0] as String, b: flat[i + 1] as int)'));
      expect(source, containsCode('({String a, int b}) get lastCall => calls.last;'));
    });

    // `_w` and the matcher import only exist for `calledWithMatching`, which only
    // methods get. Emitting them for a target without one is an `unused_element`
    // warning that `ignore_for_file: type=lint` does not silence.
    test('the matcher helper is omitted when nothing can use it', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  String get label;
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  String get label => super.noSuchMethod(Invocation.getter(#label), returnValue: '') as String;
}
''',
      );

      expect(source, isNot(containsCode('_t.Matcher _w')));
      expect(source, isNot(containsCode('package:matcher/matcher.dart')));
    });

    test('a Future from somewhere other than dart:async is not treated as async', () async {
      final source = await generate(
        interfaces: '''
class Future<T> {
  const Future();
}

abstract class Repo {
  Future<int> pending();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<int> pending() =>
      super.noSuchMethod(Invocation.method(#pending, []), returnValue: const Future<int>()) as Future<int>;
}
''',
      );

      // Stubbing it with `(_) async => value` would hand back a real Future for
      // a member whose return type merely shares the name.
      expect(source, containsCode('void mockReturnValue('));
      expect(source, isNot(containsCode('mockResolvedValue')));
    });
  });

  group('discovery', () {
    test('a mock reaching Mock through a base class is still found', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  int count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class Base extends Mock {}

class MockRepo extends Base implements Repo {
  @override
  int count() => super.noSuchMethod(Invocation.method(#count, []), returnValue: 0) as int;
}
''',
      );

      expect(source, containsCode(r'$Repo$count'));
    });

    test('a class implementing more than one interface is skipped', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  int count();
}

abstract class Extra {
  int extra();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockBoth extends Mock implements Repo, Extra {
  @override
  int count() => super.noSuchMethod(Invocation.method(#count, []), returnValue: 0) as int;
  @override
  int extra() => super.noSuchMethod(Invocation.method(#extra, []), returnValue: 0) as int;
}
''',
      );

      // There is no single interface to read signatures from, and guessing which
      // one is the target would be wrong half the time.
      expect(source, isEmpty);
    });

    test('a mock of a private type is skipped', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  int count();
}
''',
        // The private target has to be declared in the same library as the mock,
        // which is exactly how it arises: mockito cannot name it from elsewhere
        // either.
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

abstract class _Hidden {
  int hidden();
}

class MockHidden extends Mock implements _Hidden {
  @override
  int hidden() => super.noSuchMethod(Invocation.method(#hidden, []), returnValue: 0) as int;
}

class MockRepo extends Mock implements Repo {
  @override
  int count() => super.noSuchMethod(Invocation.method(#count, []), returnValue: 0) as int;
}
''',
      );

      // A facade named after a private type could not be referenced from the
      // generated file, so the target is dropped — but its neighbour is not.
      expect(source, isNot(containsCode('Hidden')));
      expect(source, containsCode('RepoMock'));
    });
  });

  group('portability regressions', () {
    // flutter/packages: pigeon marks generated ProxyApi plumbing `@protected`,
    // which the origin rule correctly calls owned. Handles for it produced 156
    // `invalid_use_of_protected_member` warnings, and being a warning rather than
    // a lint, the generated file's ignore banner did not cover them.
    test('a protected member is not given a handle', () async {
      final source = await generate(
        interfaces: '''
import 'package:meta/meta.dart';

abstract class Repo {
  @protected
  int internals();
  int public();
}
''',
        mocks: '''
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

      expect(source, isNot(containsCode(r'$Repo$internals')));
      expect(source, containsCode(r'$Repo$public'));
    });

    // A `FutureOr<T>` may be satisfied by a bare `T`. Emitting only
    // `mockResolvedValue` — which is `thenAnswer((_) async => value)` — forces a
    // Future on a caller that branches on `result is T`.
    test('a FutureOr member gets a synchronous stub as well as an async one', () async {
      final source = await generate(
        interfaces: '''
import 'dart:async';

abstract class Repo {
  FutureOr<bool> allow(String url);
}
''',
        mocks: '''
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

      expect(source, containsCode('void mockReturnValue(bool value)'));
      expect(source, containsCode('void mockResolvedValue(bool value)'));
    });

    test('a plain Future member gets no synchronous stub', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  Future<bool> allow(String url);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  Future<bool> allow(String? url) =>
      super.noSuchMethod(Invocation.method(#allow, [url]), returnValue: Future<bool>.value(false)) as Future<bool>;
}
''',
      );

      // mockito rejects `thenReturn` for a Future, so there is nothing sensible
      // a synchronous stub could do here.
      expect(source, isNot(containsCode('void mockReturnValue(')));
      expect(source, containsCode('void mockResolvedValue(bool value)'));
    });

    // Without `implements`, the facade is not a subtype of the mocked type and
    // every use of it as a value needs `.mock` — 23 times in one 800-line file.
    test('the facade implements the mock, so it passes where the type is expected', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  int count();
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  int count() => super.noSuchMethod(Invocation.method(#count, []), returnValue: 0) as int;
}
''',
      );

      expect(source, containsCode('extension type const RepoMock.of(MockRepo mock) implements MockRepo {'));
    });

    test('calledWith is at-least-once, calledOnce is exactly once', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  int count(String id);
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  int count(String? id) => super.noSuchMethod(Invocation.method(#count, [id]), returnValue: 0) as int;
}
''',
      );

      // `verify` without `called` fails only when there were no matching calls,
      // which is what plain `verify(mock.f(x))` means in mockito.
      expect(source, containsCode('void calledWith(String id) => _k.verify(_m.count(id));'));
      expect(source, containsCode('void calledOnce() => _k.verify(_m.count(_k.any)).called(1);'));
    });

    test('a handle is callable, with the widened signature verifyInOrder needs', () async {
      final source = await generate(
        interfaces: '''
abstract class Repo {
  int count(String id, {bool deep = false});
}
''',
        mocks: '''
import 'package:mockito/mockito.dart';
import 'package:pkg/api.dart';

class MockRepo extends Mock implements Repo {
  @override
  int count(String? id, {bool? deep = false}) =>
      super.noSuchMethod(Invocation.method(#count, [id], {#deep: deep}), returnValue: 0) as int;
}
''',
      );

      // Nullable, because `verifyInOrder([repo.count(any)])` passes mockito's
      // `Null get any` — and a real value still fits a nullable parameter.
      expect(source, containsCode('int call(String? id, {bool? deep}) => _m.count(id, deep: deep);'));
    });
  });
}
