# mockito_handles

Generates a typed, jest-shaped API over [mockito]'s generated mocks.

`mockito` gives you a mock class. This gives you a handle per member, so stubbing
takes no matchers and verification takes real arguments:

```dart
// before
when(() => repo.getAssetsToHash(any())).thenAnswer((_) async => [asset]);
verify(repo.getAssetsToHash('album-1')).called(1);

// after
repo.getAssetsToHash.mockResolvedValue([asset]);
repo.getAssetsToHash.calledWith('album-1');
```

Every handle is an `extension type`, which Dart erases completely — the generated
code compiles to the same calls you would have written by hand, with no wrapper
object and no indirection at runtime.

## Why the argument matchers go away

`mockito` needs `any` for every parameter because one call site does two jobs:
stubbing and verification. Splitting them removes the need entirely.

|              | takes arguments? | why                                            |
| ------------ | ---------------- | ---------------------------------------------- |
| stub         | no               | a stub applies to any call, so `any` is implied |
| verify       | yes, real values | nothing to match — you pass the value          |

That is also why `calledWith` can be **type-checked**. Signatures come from the
interface element, not from mockito's generated override: mockito widens every
non-nullable parameter to nullable so its `Null get any` can be passed, and
inheriting that widening would let `calledWith(null)` compile against a
non-nullable API. Here it is a compile error.

## Setup

```yaml
dev_dependencies:
  build_runner: ^2.4.0
  mockito_handles: ^0.1.0
  mockito: ^5.6.0
```

Declare the types to mock exactly as you already do for `mockito`:

```dart
// test/mocks.dart
import 'package:mockito/annotations.dart';
import 'package:my_app/repositories/album_repository.dart';

@GenerateNiceMocks([MockSpec<AlbumRepository>()])
void main() {}
```

Then run codegen once — no extra step, no second command:

```sh
dart run build_runner build
```

`test/mocks.mocks.dart` comes from `mockito`; `test/mocks.handles.dart` comes
from this package. The builder declares `required_inputs: ['.mocks.dart']`, so
`build_runner` will not start it until every builder that could emit a
`.mocks.dart` has finished. Handles can never be generated against a stale set of
mocks.

Like `mockito`'s own builder, this one defaults to `generate_for: ["test/**"]`.
A `.mocks.dart` outside `test/` produces no handles until you widen it:

```yaml
targets:
  $default:
    builders:
      mockito_handles:
        generate_for:
          - test/**
          - integration_test/**
```

Use the facade, which builds its own mock:

```dart
import 'mocks.handles.dart';

void main() {
  late AlbumRepositoryMock repo;

  setUp(() => repo = AlbumRepositoryMock());

  test('hashes only the assets the album reports', () async {
    repo.getAssetsToHash.mockResolvedValue([asset]);

    await sut.hashAssets();

    repo.getAssetsToHash.calledWith('album-1');
  });
}
```

Build one per test. A fresh mock has no stubs and no recorded interactions, so
there is nothing to reset; sharing one instance is the only thing that would need
resetting, and it is also what leaks call counts into the next test.

`AlbumRepositoryMock.of(existingMock)` wraps a mock you already have — useful when
something else constructed it.

### Passing the facade around

The facade `implements` the generated mock, and the mock implements your type, so
**the facade goes wherever the real type goes** — no unwrapping:

```dart
final sut = HashService(albums);                       // not albums.mock
ProviderScope(overrides: [repoProvider.overrideWithValue(albums)]);
```

A handle accessor shares its name with the member it wraps, and an extension
type's own members win over the ones it implements, so `albums.assetsIn` is the
handle. `albums.mock.assetsIn(...)` is still the real call, and a member with no
handle — an operator, a generic — stays reachable on the facade directly.

## Generated API

`mockito`'s `@GenerateNiceMocks` bakes a default into every member
(`Future<void>` completes, `Future<List<T>>` yields `[]`), so **stub only what the
test actually depends on**. A stub that restates the default is noise.

What a handle exposes depends on the member. For
`Future<List<Asset>> getAssetsToHash(String albumId)`:

| member                                   | does                                                  |
| ---------------------------------------- | ----------------------------------------------------- |
| `mockResolvedValue(List<Asset> value)`   | completes with `value`                                |
| `mockRejectedValue(Object error)`        | completes with an error — via `Future.error`, so it is not thrown synchronously |
| `mockImplementation(fn)`                 | `fn` receives the **real typed arguments**, not an `Invocation` |
| `calledWith(String albumId)`             | verifies **at least one** call with these values, matching plain `verify(...)` |
| `calledWithMatching({Object? albumId})`  | same, but each argument may be a value **or** a `Matcher`. Every parameter is optional and named, including the positional ones; **omitting one — or passing `null` — constrains nothing** |
| `calledOnce()` / `calledTimes(int n)`    | verifies the count, ignoring arguments                |
| `captured`                               | every captured argument, flat across all calls        |
| `calls` / `lastCall`                     | `captured` grouped per call, as a **record named after the real parameters** — `calls.single.albumId`, not `calls.single[0] as String` |
| `handle(...)`                            | calls the member. Takes the same widened arguments the mock does, so `any` and `captureAny` fit — this is what `verifyInOrder` needs |
| `not.calledWith(...)` / `not.calledWithMatching(...)` / `not.called()` | the negations |

`mockImplementation` taking real arguments is the point — it is what lets an
argument-dependent stub read as ordinary Dart:

```dart
repo.getStatus.mockImplementation((permission) async => statuses[permission] ?? .denied);
```

### By member kind

| kind                    | stubs                                                        | verification                         |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------ |
| async method            | `mockResolvedValue` · `mockRejectedValue` · `mockImplementation` | full set                          |
| `FutureOr<T>` method    | the async set **plus** `mockReturnValue` — a `FutureOr<T>` may be satisfied by a bare `T`, and a caller branching on `result is T` takes a different path | full set |
| async `void` method     | `mockResolvedValue()` (no argument) · `mockRejectedValue` · `mockImplementation` | full set          |
| sync method             | `mockReturnValue` · `mockImplementation` · `mockThrow`        | full set                             |
| sync `void` method      | `mockReturnValue()` · `mockThrow`                            | full set                             |
| getter                  | same as its return type implies                              | `calledOnce` · `calledTimes` · `not.called()` only — a getter is read, not called with arguments |
| setter (`set x` → `setX`) | none — a setter has nothing to return                      | `calledWith(value)` · `captured` · `not.*` |

`captured` is flat across every call, so for a member with more than one
parameter `captured.single` throws. Use `calls.single.first` instead.

### Verification is single-use

Every verification consumes the calls it matches. `mockito` marks a matched
invocation verified and will not match it again, so a second verification of the
same call fails with "No matching calls":

```dart
repo.getAssetsToHash.calledWith('album-1');
repo.getAssetsToHash.calledOnce();          // fails — the call was consumed

final args = repo.markHashed.calls;         // read once
final ids = args.single[0] as List<String>;
final force = args.single[1] as bool;       // reading `.calls` twice would fail
```

`captured`, `calls` and `lastCall` are verifications too, so the same applies:
bind the result to a local rather than reading the getter more than once.

### The facade

| member                    | does                                        |
| ------------------------- | ------------------------------------------- |
| `TypeMock()`              | builds its own mock                         |
| `TypeMock.of(mock)`       | wraps an existing one                       |
| `.mock`                   | the underlying `MockType` — for raw `mockito`, or to call a member the handle shadows |
| `.reset()`                | `mockito.reset`                             |
| `.zeroInteractions()`     | `mockito.verifyZeroInteractions`            |

`.mock` is the escape hatch for anything the handles do not cover — a stub that
captures a callback, say.

### Ordering across members

`verifyInOrder` takes the *results* of invoking a mock rather than a description
of them, so the handle is callable and forwards straight through:

```dart
verifyInOrder([
  repo.deleteUsers(any),
  api.ack(['2']),
  repo.updateUsers(any),
  api.ack(['5']),
]);
```

`handle(...)` mirrors the mock's own widened signature, so matchers fit
alongside concrete values exactly as they do in plain `mockito`.

### Reading captured arguments

`calls` groups the flat capture list per call and names the fields after the real
parameters, so nothing depends on argument position:

```dart
final call = repo.markHashed.calls.single;
expect(call.ids, ['a1', 'a2']);
expect(call.force, isFalse);
```

`captured` is still there as the flat, untyped escape hatch.

## Wiring it into a project's checks

Generated handles land next to the mocks, as `foo.handles.dart`. A project that
already excludes `*.g.dart` and `*.mocks.dart` needs a third entry:

```yaml
# analysis_options.yaml
analyzer:
  exclude:
    - "**/*.handles.dart"
```

The output is run through `dart_style` before it is written, so a repo-wide
`dart format --output=none --set-exit-if-changed .` stays green. If the project
sets a non-default width, tell the builder the same number or the check will want
to rewrap every generated file:

```yaml
# build.yaml
targets:
  $default:
    builders:
      mockito_handles:
        options:
          page_width: 120   # match analysis_options' formatter: page_width
```

## Which members get handles

A member is emitted only if the element that **declares** it lives in a package
you own. The package being built always counts, so the builder needs no
configuration to work.

This is an origin rule rather than a denylist of foreign types, because a
denylist rots. It gets the awkward cases right without naming any of them:
`HttpClientResponse implements Stream<List<int>>` loses ~60 `dart:async` members;
a router extending a framework base class loses the framework's; while a
`transaction<T>` inherited from *your* base class is kept everywhere it appears.

The consequence is worth knowing up front: **mocking a third-party type gives you
a facade with no member handles** — only `mock`, `reset` and `zeroInteractions`.
Reach through `.mock` for its members.

If your own types span several packages, name the extra ones:

```yaml
# build.yaml
targets:
  $default:
    builders:
      mockito_handles:
        options:
          additional_owned_packages:
            - my_generated_api
```

Three other kinds of member are skipped, each logged at `info`:

- **generic members** (`Future<T> transaction<T>(...)`) — `any` cannot be reified
  to an unbound `T`. This also drops any member naming its *class's* type
  parameter, since that name has no spelling in the generated file.
- **operators** — there is no accessor spelling; neither `$Repo$+` nor `_m.+(x)`
  is valid Dart.
- **anything whose signature cannot be rendered as source**, degraded per member
  so one exotic type cannot fail the whole build.

A member colliding with a name the facade declares (`mock`, `reset`,
`zeroInteractions`) is suffixed: `reset` becomes `resetMember`. Two targets
sharing a simple name are disambiguated the same way: the second becomes
`Repo2Mock`.

## Troubleshooting

Both failure modes here are quiet, because a builder that cannot handle one
member should not fail a build the whole suite depends on.

**No `.handles.dart` appeared.** The builder emits nothing when the input
declares no mockito mock. Check that the file really is a `.mocks.dart` under
`generate_for`, and that the mocks came from `mockito` — a `mocktail` mock is
ignored on purpose, since its base class is also called `Mock` but it does not
widen parameters, so handles over it would not compile.

**A member has no handle.** It was skipped for one of the reasons above, and the
reason is logged at `info` alongside a per-file summary of how many facades and
handles were emitted:

```sh
dart run build_runner build --verbose
```

Two skips are logged at `warning` instead, because they drop a whole target: a
mock class implementing more than one interface (there is no single signature
source to read), and a mock of a private type (the facade could not be named).

## Compatibility

Reads the shape of `mockito`'s generated output, so it tracks `mockito ^5.6`.
Works with `analyzer` 10 through 14.

[mockito]: https://pub.dev/packages/mockito
